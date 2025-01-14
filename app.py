from dotenv import load_dotenv
import os
import google.generativeai as genai
from typing import Dict, List, Union
import json
import re
import firebase
import logging
import gunicorn
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import requests
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Initialize Firebase Admin SDK
try:
    # Initialize Firebase Admin SDK if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate('servicekey.json')
        firebase_admin.initialize_app(cred)
    
    # Get Firestore database instance
    db = firestore.client()
except Exception as e:
    print(f"Error initializing Firebase: {str(e)}")
    db = None

class ResponseFormatter:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def preserve_formatting(self, text: str) -> str:
        """Preserve markdown formatting while adding structure"""
        # Preserve existing ** formatting
        formatted_text = text.replace('**', '||BOLD||')  # Temporarily replace ** with marker
        
        # Add formatting to headers if they don't exist
        lines = formatted_text.split('\n')
        formatted_lines = []
        for line in lines:
            # Add bold to headers if they don't already have formatting
            if ':' in line and not '||BOLD||' in line:
                header, content = line.split(':', 1)
                formatted_lines.append(f"**{header}:**{content}")
            else:
                formatted_lines.append(line)
        
        # Restore ** formatting
        formatted_text = '\n'.join(formatted_lines)
        formatted_text = formatted_text.replace('||BOLD||', '**')
        return formatted_text

    def format_academic_response(self, text: str) -> str:
        """Format academic advice responses with bullet points and sections"""
        try:
            sections = text.split("\n\n")
            formatted_sections = []
            
            # Add header to first section
            if sections[0]:
                formatted_sections.append(f"**📚 Overview:**\n{sections[0]}")
            
            # Format remaining sections
            for section in sections[1:]:
                if len(section.strip()) > 0:
                    # Preserve existing formatting while adding structure
                    formatted_section = self.preserve_formatting(section)
                    if not formatted_section.strip().startswith('•'):
                        formatted_section = "• " + formatted_section.replace("\n", "\n• ")
                    formatted_sections.append(formatted_section)
            
            return "\n\n".join(formatted_sections)
        except Exception as e:
            self.logger.error(f"Error formatting academic response: {str(e)}")
            return text

    def format_moral_response(self, text: str) -> str:
        """Format moral support responses with empathetic structure"""
        try:
            paragraphs = text.split("\n\n")
            formatted_parts = []
            
            if len(paragraphs) >= 1:
                formatted_parts.append(f"**💭 Response:**\n{self.preserve_formatting(paragraphs[0])}")
            
            if len(paragraphs) >= 2:
                formatted_parts.append(f"**💡 Suggestion:**\n{self.preserve_formatting(paragraphs[1])}")
            
            for para in paragraphs[2:]:
                formatted_para = self.preserve_formatting(para)
                if "step" in para.lower() or "tip" in para.lower():
                    formatted_parts.append(f"**✨ {formatted_para}**")
                else:
                    formatted_parts.append(f"• {formatted_para}")
            
            return "\n\n".join(formatted_parts)
        except Exception as e:
            self.logger.error(f"Error formatting moral response: {str(e)}")
            return text

    def format_university_response(self, text: str) -> str:
        """Format university life responses with practical sections"""
        try:
            sections = text.split("\n\n")
            formatted_sections = []
            
            for i, section in enumerate(sections):
                formatted_section = self.preserve_formatting(section)
                if i == 0:
                    formatted_sections.append(f"**🎓 Overview:**\n{formatted_section}")
                elif "resource" in section.lower():
                    formatted_sections.append(f"**📚 Resources:**\n{formatted_section}")
                elif any(word in section.lower() for word in ["tip", "advice", "suggestion"]):
                    formatted_sections.append(f"**💡 Helpful Tips:**\n{formatted_section}")
                else:
                    formatted_sections.append(f"• {formatted_section}")
            
            return "\n\n".join(formatted_sections)
        except Exception as e:
            self.logger.error(f"Error formatting university response: {str(e)}")
            return text
class UniversityRecommender:
    def __init__(self):
        self.model = genai.GenerativeModel('models/gemini-1.5-flash')
        self.logger = logging.getLogger(__name__)

    def _get_university_image(self, university_name: str, country: str) -> str:
        """Generate image URL for a university"""
        formattedname = ""
        formattedcountry = ""
        for i in university_name:
            if i == ' ' or i == '+':
                formattedname += '+'
            else:
                formattedname += i
            
        for i in country:
            if i == ' ' or i == '+':
                formattedcountry += '+'
            else:
                formattedcountry += i
        search_query = f"{formattedname}"
        imageapikey = os.getenv('IMAGE_API_KEY')
        print(search_query)
        coolquery = f"https://www.googleapis.com/customsearch/v1?key=AIzaSyDptyzxGJg-aR5IldozvISzjNgF2_TISJo&cx=e1cac863f07bf4f8b&q={search_query}&searchType=image"
        imageresponse = requests.get(coolquery).json()
        self.logger.warning(imageresponse.get('items')[0].get('link'))
        return imageresponse.get('items')[0].get('link') #"https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/813.png"
    # def _get_university_image(self, university_name: str, country: str) -> str:   
    #     return "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/813.png"
    def _generate_university_label(self, university_name: str, faculty_strengths: str) -> List[Dict[str, str]]:
        """Generate badge with only verified rankings and achievements"""
        try:
            prompt = f"""
            For {university_name}, provide ONLY 100% VERIFIED and CURRENT ranking from official sources (QS World Rankings, Times Higher Education, or official national rankings).
            Return in this exact JSON format:
            [
                {{
                    "type": "ranking",
                    "text": "EXACT current ranking with specific region",
                    "details": "Exact year",
                    "field": "Ranking field"
                }}
            ]

            STRICT RULES:
            1. Only include rankings that you are 100% certain are current and accurate
            2. Must specify exact region ONLY TRUE ONES! (e.g. "#5 in Italy for Engineering", "#120 Globally", "#15 in Europe for Business")
            3. Include ranking year
            4. If no verified current ranking exists, return "Established University"
            5. NO ESTIMATES OR GUESSES - if uncertain, return "Established University"
            6. should not be long like 1-5 words max
            7. REAL CHECKED INFORMATION !!!
            """

            response = self.model.generate_content(prompt)
            badges = json.loads(response.text)
            
            if len(badges) > 0:
                badge = badges[0]
                # Determine color and icon based on ranking type
                if "Globally" in badge["text"]:
                    color_class = "bg-blue-500"
                    prefix = "🌐"
                elif "Europe" in badge["text"]:
                    color_class = "bg-green-500"
                    prefix = "🌍"
                else:
                    color_class = "bg-blue-600"
                    prefix = "🎓"
            else:
                # Default if no verified ranking
                badge = {
                    "text": "Established University",
                    "details": "Higher Education Institution",
                    "field": "Education"
                }
                color_class = "bg-blue-600"
                prefix = "🎓"

            return [{
                "text": badge["text"],
                "details": badge["details"],
                "field": badge["field"],
                "color_class": color_class,
                "prefix": prefix
            }]

        except Exception as e:
            self.logger.error(f"Error generating university label: {str(e)}")
            return [{
                "text": "University",
                "details": "Higher Education Institution",
                "field": "Education",
                "color_class": "bg-blue-600",
                "prefix": "🎓"
            }]


    def get_university_details(self, university_name: str, country: str) -> Dict:
        """Get detailed information about a university"""
        try:
            prompt = f"""
                Please provide detailed information about {university_name} in {country}.
                Return the response in this exact JSON format:
                {{
                    "description": "Brief overview",
                    "notablePrograms": "List of programs",
                    "campusLife": "Description of campus life",
                    "admissionRequirements": {{
                        "general": "General admission requirements",
                        "gpa": "Minimum GPA requirement",
                        "englishRequirements": {{
                            "ielts": "Minimum IELTS score required",
                            "notes": "Additional information about English requirements"
                        }},
                        "documents": "Required documents for application"
                    }},
                    "researchOpportunities": "Research facilities and options",
                    "ranking": "Current rankings"
                }}

                Make sure to include SPECIFIC IELTS requirements if available.
                """

            response = self.model.generate_content(prompt)
            if not response.text:
                return {"error": "No response received from AI model"}

            # Clean and sanitize the response text
            cleaned_text = response.text.strip()
            
            # Remove code block markers if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            # Replace problematic characters
            cleaned_text = (
                cleaned_text
                .replace('\n', ' ')
                .replace('\r', '')
                .replace('\t', ' ')
            )
            
            # Clean up multiple spaces
            cleaned_text = ' '.join(cleaned_text.split())
            
            try:
                # First attempt: direct JSON parse
                details = json.loads(cleaned_text)
            except json.JSONDecodeError:
                try:
                    # Second attempt: Use regex to extract JSON object
                    json_match = re.search(r'{.*}', cleaned_text, re.DOTALL)
                    if json_match:
                        details = json.loads(json_match.group())
                    else:
                        raise ValueError("No valid JSON object found")
                except (json.JSONDecodeError, ValueError) as e:
                    self.logger.error(f"JSON parsing error: {str(e)}\nCleaned text: {cleaned_text}")
                    return {
                        "error": "Failed to parse university details",
                        "description": "Error retrieving university information",
                        "notablePrograms": "Information unavailable",
                        "campusLife": "Information unavailable",
                        "admissionRequirements": "Information unavailable",
                        "researchOpportunities": "Information unavailable",
                        "ranking": "Information unavailable"
                    }

            # Validate required fields
            required_fields = [
                "description", "notablePrograms", "campusLife",
                "admissionRequirements", "researchOpportunities", "ranking"
            ]
            
            # Ensure all required fields exist
            for field in required_fields:
                if field not in details:
                    details[field] = "Information unavailable"
                    
                    # Add image URL and label
           # Validate required fields
            required_fields = [
                "description", "notablePrograms", "campusLife",
                "admissionRequirements", "researchOpportunities", "ranking"
            ]
            
            # Ensure all required fields exist
            for field in required_fields:
                if field not in details:
                    details[field] = "Information unavailable"
            
            # Add image URL
            details['imageUrl'] = self._get_university_image(university_name, country)
            
            # Generate and add label
            details['label'] = self._generate_university_label(university_name, details.get('notablePrograms', ''))
            
            return details

        except Exception as e:
            self.logger.error(f"Error fetching university details: {str(e)}")
            return {
                "error": f"Error fetching university details: {str(e)}",
                "description": "Error retrieving university information",
                "notablePrograms": "Information unavailable",
                "admissionRequirements": "Information unavailable",
                "researchOpportunities": "Information unavailable",
                "ranking": "Information unavailable"
            }


    def recommend(self, country: str, faculty: str = None, gpa: str = None,
                    budget: str = None, sat: str = None, extra: str = None) -> Union[List[Dict], Dict[str, str]]:
        """Generate accurate university recommendations with specific, verified data"""
        if not country:
            return {"error": "Country is required"}

        try:
            prompt = f"""
            Return EXACTLY 6 universities in {country} with VERIFIED data.
            
            You MUST:
            1. Return the response in VALID JSON format
            2. Only provide real information
            3. Use specific numbers and ranges instead of "Varies"
            4. Follow this EXACT example format:

            [
                {{
                    "universityName": "Full Official Name",
                    "location": "City, {country}",
                    "tuition": {{
                        "amount": "Exact amount in local currency",
                        "details": "Annual/semester and program info"
                    }},
                    "admissionStats": {{
                        "acceptanceRate": {{
                            "rate": "Exact percentage or range (e.g. 65-75%)",
                            "year": "2023"
                        }},
                        "gpaRequirements": {{
                            "minimum": "3.0",
                            "preferred": "3.5+",
                            "notes": "For general admission"
                        }}
                    }},
                    "facultyStrengths": [
                        {{
                            "field": "Computer Science",
                            "ranking": "#5 in Europe",
                            "source": "QS Rankings 2024"
                        }}
                    ]
                }}
            ]
            """

            if faculty:
                prompt += f"\nFocus on universities strong in: {faculty}"
            if gpa:
                prompt += f"\nTarget GPA level: {gpa}"
            if sat:
                prompt += f"\nTarget SAT score: {sat}"
            if budget:
                prompt += f"\nTarget budget: {budget}"
            if extra:
                prompt += f"\nAdditional criteria: {extra}"

            response = self.model.generate_content(prompt)
            if not response or not response.text:
                raise ValueError("No response received from model")

            # Clean the response text
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()

            try:
                recommendations = json.loads(cleaned_text)
            except json.JSONDecodeError as e:
                json_match = re.search(r'\[.*\]', cleaned_text, re.DOTALL)
                if not json_match:
                    retry_prompt = f"""
                    The previous response was not valid JSON. Please provide exactly 6 universities in {country} 
                    in STRICT JSON format. No explanations, no markdown, ONLY the JSON array.
                    """
                    retry_response = self.model.generate_content(retry_prompt)
                    cleaned_retry = retry_response.text.strip()
                    if cleaned_retry.startswith("```json"):
                        cleaned_retry = cleaned_retry[7:]
                    if cleaned_retry.endswith("```"):
                        cleaned_retry = cleaned_retry[:-3]
                    recommendations = json.loads(cleaned_retry)
                else:
                    recommendations = json.loads(json_match.group())

            processed_recommendations = []
            for uni in recommendations:
                # Process each university recommendation
                try:
                    if not all(key in uni for key in ["universityName", "location", "tuition"]):
                        continue

                    processed_uni = {
                        "universityName": uni["universityName"],
                        "location": uni["location"],
                        "tuition": self._format_tuition_info(uni["tuition"]),
                        "acceptanceRate": self._format_acceptance_info(
                            uni.get("admissionStats", {}).get("acceptanceRate", {})
                        ),
                        "GPA": self._format_gpa_info(
                            uni.get("admissionStats", {}).get("gpaRequirements", {})
                        ),
                        "facultyStrengths": self._format_faculty_strengths(
                            uni.get("facultyStrengths", [])
                        )
                    }

                    processed_uni["imageUrl"] = self._get_university_image(
                        processed_uni["universityName"], 
                        country
                    )
                    processed_uni["label"] = self._generate_university_label(
                        processed_uni["universityName"], 
                        processed_uni["facultyStrengths"]
                    )
                    
                    processed_recommendations.append(processed_uni)
                except Exception as e:
                    self.logger.error(f"Error processing university {uni.get('universityName', 'unknown')}: {str(e)}")
                    continue

            if not processed_recommendations:
                return {"error": "Could not generate verified recommendations"}

            return processed_recommendations

        except Exception as e:
            self.logger.error(f"Error in recommend method: {str(e)}")
            return {"error": f"Error generating recommendations: {str(e)}"}     

    def _format_tuition_info(self, tuition_data: Dict) -> str:
        """Format tuition information with specific details"""
        if isinstance(tuition_data, dict):
            amount = tuition_data.get("amount", "")
            details = tuition_data.get("details", "")
            
            formatted = f"{amount}"
            if details:
                formatted += f" ({details})"
            return formatted
        return str(tuition_data)

    def _format_acceptance_info(self, acceptance_data: Dict) -> str:
        """Format acceptance rate information TRUE INFO"""
        if isinstance(acceptance_data, dict):
            rate = acceptance_data.get("rate", "")
            year = acceptance_data.get("year", "")
            
            formatted = rate
            if year:
                formatted += f" ({year})"
            return formatted
        return str(acceptance_data)

    def _format_gpa_info(self, gpa_data: Dict) -> str:
        """Format GPA requirements with detailed ranges"""
        if isinstance(gpa_data, dict):
            minimum = gpa_data.get("minimum", "")
            preferred = gpa_data.get("preferred", "")
            notes = gpa_data.get("notes", "")
            parts = []
            if minimum:
                parts.append(f"Min: {minimum}")
            if preferred:
                parts.append(f"Preferred: {preferred}")
            formatted = ", ".join(parts)
            if notes:
                formatted += f" ({notes})"
            return formatted or "Not specified"
        return str(gpa_data)
    def _format_faculty_strengths(self, strengths: List) -> str:
        """Format faculty strengths(checked info) with rankings regional(continent or country or global)"""
        if isinstance(strengths, list):
            formatted_strengths = []
            for strength in strengths:
                if isinstance(strength, dict):
                    field = strength.get("field", "")
                    ranking = strength.get("ranking", "")
                    if field and ranking:
                        formatted_strengths.append(f"{field} ({ranking})")
                    elif field:
                        formatted_strengths.append(field)
            return ", ".join(formatted_strengths)
        return str(strengths)
        
        
    def get_career_guidance(self, question_count: int, previous_prompt: str = "") -> tuple:
        """Generate AI-driven career guidance questions and process responses"""
        try:
            if question_count == 6:
                analysis_prompt = f"""Based on the following conversation, provide a detailed career analysis in this JSON format:
                {{
                    "profile_traits": [
                        {{"name": "trait name", "description": "trait description"}},
                        // 3-4 key traits based on the conversation
                    ],
                    "specializations": [
                        {{
                            "title": "specialization name",
                            "description": "detailed description",
                            "skills": ["skill1", "skill2", "skill3"],
                            "recommended_courses": ["course1", "course2"]
                        }},
                        // exactly 3 specializations ordered by best match
                    ],
                    "summary": "brief summary of career direction"
                }}

                Previous conversation: {previous_prompt}
                """
                
                response = self.model.generate_content(analysis_prompt)
                try:
                    cleaned_text = response.text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                        
                    analysis = json.loads(cleaned_text)
                    return analysis, ""
                except json.JSONDecodeError as e:
                    self.logger.error(f"Failed to parse career analysis JSON: {e}")
                    return {"error": "Failed to analyze career guidance"}, ""

            if question_count == 1:
                prompt = """You are a career guidance counselor. Create a thought-provoking first question about the student's interests, passions, and values,but make the questions simple.
                Format your response exactly as: Question
                Make the question specific and engaging."""
            else:
                prompt = f"""Based on this conversation history:
                {previous_prompt}
                
                Generate the next career guidance question that builds upon previous answers.
                Make the question more specific and focused on career direction.
                Consider previous responses to make questions more relevant.
                
                Format your response exactly as: Question"""

            response = self.model.generate_content(prompt)
            if not response.text:
                return "Error generating question", ""
                
            parts = response.text.split('(sep)')
            return parts[0].strip(), parts[1].strip() if len(parts) > 1 else ""
                
        except Exception as e:
            self.logger.error(f"Error in career guidance: {str(e)}")
            return "Error generating question", ""
# Initialize Flask application
app = Flask(__name__)
app.secret_key = "dev_secret_key_123"
logging.basicConfig(level=logging.INFO)

# Инициализация сервисов
recommender = UniversityRecommender()
response_formatter = ResponseFormatter()

# # Декоратор для проверки аутентификации
# def login_required(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         auth_cookie = request.cookies.get('firebase_auth')
#         if not auth_cookie:
#             return redirect(url_for('login', next=request.url))
#         return f(*args, **kwargs)
#     return decorated_function

@app.route('/login')
def login():
    # Если пользователь уже аутентифицирован, перенаправляем на главную
    auth_cookie = request.cookies.get('firebase_auth')
    if auth_cookie:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/register')
def register():
    # Если пользователь уже аутентифицирован, перенаправляем на главную
    auth_cookie = request.cookies.get('firebase_auth')
    if auth_cookie:
        return redirect(url_for('index'))
    return render_template('register.html')
@app.route('/user')
def user_profile():
    """Render the user profile page"""
    return render_template('user.html')

@app.route('/')
def index():
    return render_template('mainpage.html')

@app.route('/advisor')
def advisor():
    return render_template("advisor.html")
@app.route('/chat', methods=['POST'])
def chat():
    message = request.form.get('message')
    university_name = request.form.get('university_name')
    print(f"Received message: {message}")  # Debug print
    print(f"For university: {university_name}")  # Debug print
    
    if not message or not university_name:
        return jsonify({"error": "Message and university name are required"}), 400
    
    try:
        prompt = f"""Act as an AI advisor with specific knowledge about {university_name}. 
        Answer this question: {message}
        
        Provide specific details about {university_name} relevant to the question.
        Include information about programs, campus life, requirements, or other relevant aspects.
        Use clear sections with markdown **bold** for headers."""
        
        print(f"Sending prompt to model: {prompt}")  # Debug print
        response = recommender.model.generate_content(prompt)
        print(f"Model response: {response.text}")  # Debug print
        
        if not response.text:
            return jsonify({"error": "Failed to generate response"}), 500
            
        formatted_response = response_formatter.format_university_response(response.text)
        print(f"Formatted response: {formatted_response}")  # Debug print
        
        return jsonify({
            "response": formatted_response,
            "status": "success"
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Debug print
        return jsonify({
            "error": "Failed to generate response",
            "details": str(e)
        }), 500
@app.route('/university_details', methods=['POST'])
def university_details():
    university_name = request.form.get('university_name')
    country = request.form.get('country')
    
    if not university_name or not country:
        return jsonify({"error": "University name and country are required"}), 400
        
    details = recommender.get_university_details(university_name, country)
    return jsonify(details)

@app.route('/unichooser', methods=['GET', 'POST'])
def unichooser():
    if request.method == 'POST':
        form_data = {
            'country': request.form.get('country', '').strip(),
            'faculty': request.form.get('faculty', '').strip(),
            'gpa': request.form.get('gpa', '').strip(),
            'budget': request.form.get('budget', '').strip(),
            'sat': request.form.get('sat', '').strip(),
            'extra': request.form.get('extra', '').strip()
        }
        
        form_data = {k: v for k, v in form_data.items() if v}
        app.logger.info(f"Processing recommendation request: {form_data}")
        
        if not form_data.get('country'):
            return render_template("index.html", error="Country is required")
        
        try:
            recommendations = recommender.recommend(**form_data)
            app.logger.info(f"Generated recommendations: {recommendations}")
            
            if isinstance(recommendations, dict) and 'error' in recommendations:
                return render_template("index.html", error=recommendations['error'])
            
            return render_template(
                "index.html", 
                recommendations=recommendations,
                country=form_data['country']
            )
            
        except Exception as e:
            app.logger.error(f"Error processing recommendations: {str(e)}")
            return render_template(
                "index.html",
                error=f"An error occurred while processing your request: {str(e)}"
            )
    
    return render_template("index.html")

@app.route('/loadquiz', methods=['GET', 'POST'])
def career_quiz():
    if request.method == 'GET':
        # Start new quiz
        question, description = recommender.get_career_guidance(1)
        session['quiz_started'] = datetime.now().isoformat()
        
        return render_template(
            'quiz.html',
            question=question,
            description=description,
            count=1,
            newprompt=' You asked: ' + question
        )
    
    count = int(request.form.get('hid', 1))
    answer = request.form.get('answer', '')
    previous_prompt = request.form.get('hidprompt', '')
    new_prompt = previous_prompt + ' I answered: ' + answer

    try:
        if count >= 6:
            # Get final analysis
            analysis, _ = recommender.get_career_guidance(count, new_prompt)
            
            if isinstance(analysis, dict):
                if 'error' in analysis:
                    return render_template(
                        'specialty.html',
                        error=True
                    )
                
                # Store analysis in session for later use
                session['career_analysis'] = analysis
                
                return render_template(
                    'specialty.html',
                    error=False,
                    profile_traits=analysis.get('profile_traits', []),
                    specializations=analysis.get('specializations', []),
                    summary=analysis.get('summary', '')
                )

        # Generate next question
        question, description = recommender.get_career_guidance(count, new_prompt)
        
        if isinstance(question, dict) and 'error' in question:
            return render_template(
                'quiz.html',
                question="An error occurred. Please try again.",
                description='',
                count=count,
                newprompt=new_prompt
            )
            
        return render_template(
            'quiz.html',
            question=question,
            description=description,
            count=count + 1,
            newprompt=str(new_prompt) + '; You asked: ' + str(question)
        )
        
    except Exception as e:
        app.logger.error(f"Error in career quiz: {str(e)}")
        return render_template(
            'specialty.html',
            error=True
        )
@app.route('/gpa-calculator')
def gpa_calculator():
    """Render the GPA calculator page"""
    return render_template('gpa_calculator.html')

@app.route('/calculate-gpa', methods=['POST'])
def calculate_gpa():
    """Calculate GPA based on submitted grades"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        subjects = data.get('subjects', [])
        grading_system = data.get('gradingSystem')
        
        if not subjects:
            return jsonify({'error': 'No subjects provided'}), 400
            
        # Define grade point mappings
        letter_to_gpa = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0
        }
        
        def numeric_to_gpa(grade):
            """Convert numeric grade to GPA points"""
            grade = float(grade)
            if grade >= 5.0: return 4.0
            if grade >= 4.0: return 3.0
            if grade >= 3.0: return 2.0
            if grade >= 2.0: return 1.0
            return 0.0
            
        total_points = 0
        total_credits = 0
        
        # Calculate GPA
        for subject in subjects:
            try:
                credits = float(subject['credits'])
                if credits <= 0:
                    return jsonify({'error': 'Credits must be greater than 0'}), 400
                    
                if grading_system == 'letter':
                    grade_points = letter_to_gpa.get(subject['grade'].upper())
                    if grade_points is None:
                        return jsonify({'error': f'Invalid letter grade: {subject["grade"]}'}), 400
                else:
                    try:
                        grade = float(subject['grade'])
                        if not (2.0 <= grade <= 5.0):
                            return jsonify({'error': 'Numeric grade must be between 2.0 and 5.0'}), 400
                        grade_points = numeric_to_gpa(grade)
                    except ValueError:
                        return jsonify({'error': 'Invalid numeric grade'}), 400
                
                total_points += grade_points * credits
                total_credits += credits
                
            except (KeyError, ValueError) as e:
                return jsonify({'error': f'Invalid subject data: {str(e)}'}), 400
                
        if total_credits == 0:
            return jsonify({'error': 'Total credits cannot be zero'}), 400
            
        gpa = total_points / total_credits
        
        return jsonify({
            'gpa': round(gpa, 2),
            'status': 'success'
        })
        
    except Exception as e:
        app.logger.error(f'Error calculating GPA: {str(e)}')
        return jsonify({'error': 'An error occurred while calculating GPA'}), 500


@app.route('/career-advisor')
def career_advisor():
    """Render the simplified career advisor input page"""
    return render_template('career_advisor.html')

@app.route('/analyze-career', methods=['POST'])
def analyze_career():
    """Analyze the career path and generate recommendations"""
    profession = request.form.get('profession')
    
    if not profession:
        return redirect(url_for('career_advisor'))
        
    try:
        # Career analysis prompt for Gemini
        prompt = f"""
        Analyze the career path for {profession} and provide detailed information in this exact JSON format:
        {{
            "career_path": {{
                "title": "{profession}",
                "description": "Detailed 2-3 sentence description of the career",
                "future_prospects": "2-3 sentences about future opportunities and industry outlook"
            }},
            "required_skills": [
                {{
                    "category": "Technical Skills",
                    "skills": ["skill1", "skill2", "skill3"],
                    "importance": "Why these technical skills matter for this role"
                }},
                {{
                    "category": "Soft Skills",
                    "skills": ["skill1", "skill2", "skill3"],
                    "importance": "Why these soft skills are crucial for success"
                }},
                {{
                    "category": "Industry Knowledge",
                    "skills": ["skill1", "skill2", "skill3"],
                    "importance": "Why understanding these areas matters"
                }}
            ],
            "recommended_books": [
                {{
                    "title": "Book title",
                    "author": "Author name",
                    "description": "Why this book is valuable for this career",
                    "key_takeaways": ["key point 1", "key point 2", "key point 3"]
                }},
                {{
                    "title": "Book title",
                    "author": "Author name",
                    "description": "Why this book is valuable for this career",
                    "key_takeaways": ["key point 1", "key point 2", "key point 3"]
                }}
            ],
            "education_path": {{
                "degree_requirements": "Required education level and common degrees",
                "relevant_fields": ["field1", "field2", "field3"],
                "specializations": ["specialization1", "specialization2", "specialization3"]
            }},
            "university_criteria": {{
                "recommended_programs": ["program1", "program2", "program3"],
                "key_courses": ["course1", "course2", "course3"],
                "suggested_country": "Best country for studying this field"
            }}
        }}
        
        IMPORTANT GUIDELINES:
        1. Provide SPECIFIC, ACTIONABLE information
        2. Focus on current industry standards and requirements
        3. Include both entry-level and advanced skills
        4. Recommend modern, highly-rated books
        5. Suggest concrete specializations and courses
        6. Be realistic about education requirements
        7. Consider global study opportunities
        """
        
        # Get career analysis from Gemini
        response = recommender.model.generate_content(prompt)
        
        if not response.text:
            raise ValueError("No response received from AI model")
            
        # Clean and parse the response
        cleaned_text = response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        analysis = json.loads(cleaned_text)
        
        # Store university search criteria in session
        session['university_search'] = {
            'programs': analysis['university_criteria']['recommended_programs'],
            'country': analysis['university_criteria']['suggested_country']
        }
        
        # Create activity record if user is logged in
        if 'firebase_auth' in request.cookies:
            try:
                # Get user ID from Firebase auth
                auth_cookie = request.cookies.get('firebase_auth')
                user_id = json.loads(auth_cookie)['user_id']
                
                # Add activity to user's record
                db.collection('users').document(user_id).collection('activity').add({
                    'type': 'career_analysis',
                    'profession': profession,
                    'timestamp': firebase.firestore.FieldValue.serverTimestamp(),
                    'description': f'Analyzed career path for {profession}'
                })
                
                # Update user's career interests
                db.collection('users').document(user_id).set({
                    'last_career_search': profession,
                    'career_interests': firebase.firestore.ArrayUnion([profession])
                }, merge=True)
                
            except Exception as e:
                app.logger.error(f"Error saving user activity: {str(e)}")
                # Continue even if activity logging fails
        
        return render_template(
            'career_path.html',
            analysis=analysis,
            profession=profession
        )
        
    except json.JSONDecodeError as e:
        app.logger.error(f"JSON parsing error: {str(e)}\nResponse text: {cleaned_text}")
        return render_template(
            'career_advisor.html',
            error="Sorry, we had trouble processing the career analysis. Please try again."
        )
        
    except Exception as e:
        app.logger.error(f"Error in career analysis: {str(e)}")
        return render_template(
            'career_advisor.html',
            error="An error occurred while analyzing the career path. Please try again."
        )

@app.route('/find-universities', methods=['POST'])
def find_universities():
    """Redirect to university search with career-based criteria"""
    if 'university_search' not in session:
        return redirect(url_for('career_advisor'))
        
    search_criteria = session['university_search']
    
    # Log search if user is logged in
    if 'firebase_auth' in request.cookies:
        try:
            auth_cookie = request.cookies.get('firebase_auth')
            user_id = json.loads(auth_cookie)['user_id']
            
            db.collection('users').document(user_id).collection('activity').add({
                'type': 'university_search',
                'criteria': search_criteria,
                'timestamp': firebase.firestore.FieldValue.serverTimestamp(),
                'description': f'Searched universities for {search_criteria["programs"][0]}'
            })
        except Exception as e:
            app.logger.error(f"Error logging university search: {str(e)}")
    
    return redirect(url_for(
        'unichooser',
        faculty=search_criteria['programs'][0],
        country=search_criteria['country']
    ))


@app.route('/apply-recommendations', methods=['POST'])
def apply_recommendations():
    """Apply career recommendations to university search"""
    if 'career_analysis' not in session:
        return jsonify({"error": "No career analysis found"}), 400
        
    analysis = session['career_analysis']
    
    # Get primary specialization if available
    if analysis.get('specializations') and len(analysis['specializations']) > 0:
        primary_spec = analysis['specializations'][0]['title']
    else:
        primary_spec = ""
    
    # Redirect to university search with pre-filled parameters
    return redirect(url_for('unichooser', faculty=primary_spec))

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500


@app.route('/search_university', methods=['POST'])
def search_university():
    try:
        university_name = request.form.get('university_name')
        country = request.form.get('country', 'global')
        
        if not university_name:
            return jsonify({"error": "University name is required"}), 400
            
        # Используем существующий класс UniversityRecommender
        details = recommender.get_university_details(university_name, country)
        
        # Проверяем наличие ошибки в ответе
        if "error" in details:
            return jsonify({"error": details["error"]}), 404
            
        # Добавляем название университета в ответ
        details["universityName"] = university_name
            
        return jsonify(details)
        
    except Exception as e:
        app.logger.error(f"Error in search_university: {str(e)}")
        return jsonify({
            "error": "Failed to fetch university details",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Configure API key
    genai.configure(api_key="AIzaSyD5z7jcpdYlzjVKsT6bjWpf-CHj_I1HwsQ")
    
    # Run the application
    app.run(debug=True, port=10000)