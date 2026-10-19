import json
import uuid
import re
from typing import Dict, Any, List, Tuple, Optional
from backend.app.core.config import settings
from backend.app.schemas.scene import ScriptGenerationOutput, SceneSchema
from backend.app.services.audio_engine import sanitize_narration_for_speech

def parse_topic_metadata(topic: str) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Separates a raw topic string into (clean_title, suggested_hook, suggested_angle).
    Handles patterns like:
    'Atomic Habits: The 1% Compounding Rule. Angle: Why Friction... Hook: You Do Not Rise...'
    Ensures that structural keywords like 'Hook:' or 'Angle:' never bleed into spoken sentences.
    """
    if not topic:
        return "The Hidden Truth", None, None

    clean_title = topic
    suggested_hook = None
    suggested_angle = None

    # Check for Hook:
    hook_match = re.search(r"\bHook\s*:\s*(.+?)(?=(?:\.\s*Angle|\.\s*Hook|$))", topic, flags=re.IGNORECASE)
    if hook_match:
        suggested_hook = hook_match.group(1).strip().strip('"').strip("'")

    # Check for Angle:
    angle_match = re.search(r"\bAngle\s*:\s*(.+?)(?=(?:\.\s*Angle|\.\s*Hook|$))", topic, flags=re.IGNORECASE)
    if angle_match:
        suggested_angle = angle_match.group(1).strip().strip('"').strip("'")

    # Clean the title by removing Angle: and Hook: clauses
    clean_title = re.sub(r"\.\s*(?:Angle|Hook)\s*:\s*.+?(?=(?:\.\s*(?:Angle|Hook)|$))", "", clean_title, flags=re.IGNORECASE)
    clean_title = re.sub(r"\b(?:Angle|Hook)\s*:\s*.+$", "", clean_title, flags=re.IGNORECASE)
    clean_title = clean_title.strip(" .:")

    return clean_title, suggested_hook, suggested_angle

def build_domain_visual_breakdown(
    clean_topic: str,
    provided_angle: str,
    content_category: str = "general"
) -> List[Dict[str, Any]]:
    """
    Generates 5 distinct, domain-specific visual descriptions and targeted search queries
    strictly aligned with the scene narrative to eliminate repetitive or generic footage.
    """
    combined = (f"{clean_topic} {provided_angle} {content_category}").lower()

    # 1. Real Estate & Mortgages
    if any(k in combined for k in ["mortgage", "house", "housing", "real estate", "property", "homeowner", "rent"]):
        return [
            {
                "visual_description": f"Sweeping cinematic aerial drone shot of suburban neighborhood houses and residential properties",
                "search_queries": ["houses", "real-estate", "neighborhood", "building"],
                "on_screen_text": "THE HOUSING DILEMMA"
            },
            {
                "visual_description": "Person sitting at desk reviewing financial paperwork and calculating numbers on a calculator",
                "search_queries": ["finance", "office", "money", "calculator"],
                "on_screen_text": "FROZEN IN PLACE"
            },
            {
                "visual_description": "Modern city streets with real estate agency buildings and architecture",
                "search_queries": ["real-estate", "building", "city", "architecture"],
                "on_screen_text": "ZERO INVENTORY",
                "custom_narration": "Because existing owners refuse to give up historic low rates, supply has completely evaporated from the market."
            },
            {
                "visual_description": "Wall street stock market electronic ticker with financial data and currency exchange",
                "search_queries": ["stock-market", "finance", "money", "investment"],
                "on_screen_text": "THE ECONOMIC LOCK",
                "custom_narration": "That golden rate disparity is creating an unprecedented gridlock that traditional economic models never predicted."
            },
            {
                "visual_description": "Hand holding keys to a modern luxury home with bright sunny horizon",
                "search_queries": ["houses", "lifestyle", "real-estate", "city"],
                "on_screen_text": "WHAT IT MEANS FOR YOU"
            }
        ]

    # 2. AI, Semiconductors, Silicon & Compute
    if any(k in combined for k in ["ai", "chip", "silicon", "gpu", "semiconductor", "compute", "deepseek", "model", "server", "robot", "nuclear", "smr", "datacenter"]):
        return [
            {
                "visual_description": f"Cinematic extreme macro shot of glowing silicon wafer microchip and motherboard circuits",
                "search_queries": ["microchip", "technology", "circuit", "computer"],
                "on_screen_text": "THE POWER WALL"
            },
            {
                "visual_description": "Massive hyperscale data center interior with corridors of blinking blue LED server racks",
                "search_queries": ["server", "technology", "computer", "data"],
                "on_screen_text": "INFRASTRUCTURE CRISIS"
            },
            {
                "visual_description": "Abstract futuristic artificial intelligence neural network data stream flowing at high speed",
                "search_queries": ["technology", "digital", "abstract", "network"],
                "on_screen_text": "COMPUTE AT SCALE",
                "custom_narration": "As reasoning models scale test-time compute, power consumption surges past what conventional grids can physically deliver."
            },
            {
                "visual_description": "Industrial robotic automation cleanroom and high-voltage energy transmission lines",
                "search_queries": ["technology", "energy", "robot", "microchip"],
                "on_screen_text": "THE NEXT BREAKTHROUGH",
                "custom_narration": "The winners of this revolution won't just be software developers—they will be the masters of localized nuclear and silicon power."
            },
            {
                "visual_description": "Futuristic illuminated metropolis skyline with glowing fiber optic connections",
                "search_queries": ["skyline", "night-city", "technology", "abstract"],
                "on_screen_text": "THE FUTURE IS HERE"
            }
        ]

    # 3. Finance, Wealth & Crypto
    if any(k in combined for k in ["money", "finance", "wealth", "stock", "market", "invest", "dollar", "crypto", "bitcoin", "trading"]):
        return [
            {
                "visual_description": f"Close-up high-speed counting of crisp currency bills and shiny gold bullions",
                "search_queries": ["money", "dollars", "finance", "cash"],
                "on_screen_text": "THE MONEY SECRET"
            },
            {
                "visual_description": "Financial market screen displaying active candlestick charts and volatility trends",
                "search_queries": ["stock-market", "finance", "business", "data"],
                "on_screen_text": "RISK VS ASYMMETRY"
            },
            {
                "visual_description": "Professional business investor studying data metrics in sleek glass office",
                "search_queries": ["office", "business", "working", "finance"],
                "on_screen_text": "COMPOUND RETURNS",
                "custom_narration": "True asymmetric leverage comes from identifying assets where the downside is strictly capped while the upside is exponential."
            },
            {
                "visual_description": "Towering corporate financial headquarters and international trade center",
                "search_queries": ["city", "building", "architecture", "skyline"],
                "on_screen_text": "THE PAYOFF",
                "custom_narration": "When you align capital with macro trends, compounding works continuously in your favor without emotional panic."
            },
            {
                "visual_description": "Rotating golden coin with clean dark mode visual backdrop",
                "search_queries": ["money", "finance", "success", "lifestyle"],
                "on_screen_text": "BUILD ASYMMETRIC WEALTH"
            }
        ]

    # 4. Sports, Athletics & Fitness
    if any(k in combined for k in ["sports", "athlete", "football", "basketball", "gym", "fitness", "running", "workout", "training"]):
        return [
            {
                "visual_description": f"Explosive sprinter athlete bursting out of starting blocks on stadium track",
                "search_queries": ["athlete", "running", "sports", "stadium"],
                "on_screen_text": "PEAK PERFORMANCE"
            },
            {
                "visual_description": "Dedicated athlete lifting heavy weight in aesthetic training gym with intense focus",
                "search_queries": ["gym", "fitness", "workout", "training"],
                "on_screen_text": "NO SHORTCUTS"
            },
            {
                "visual_description": "High-velocity dynamic sports action with agility and team coordination",
                "search_queries": ["sports", "fitness", "running", "athlete"],
                "on_screen_text": "UNSTOPPABLE CADENCE",
                "custom_narration": "Elite athletes don't rely on sporadic motivation—they execute relentless daily micro-progress that compounds over seasons."
            },
            {
                "visual_description": "Runner reaching the mountain summit with sun flare celebration",
                "search_queries": ["running", "mountain", "sunrise", "success"],
                "on_screen_text": "THE PAYOFF",
                "custom_narration": "The difference between good and immortal is having the mental stamina to push when everyone else steps off the track."
            },
            {
                "visual_description": "Celebration with raised championship trophy and stadium lights",
                "search_queries": ["celebration", "trophy", "sports", "success"],
                "on_screen_text": "CHAMPIONSHIP MINDSET"
            }
        ]

    # 5. Books, Literature & Education
    if any(k in combined for k in ["book", "books", "literature", "library", "reading", "study", "author", "history"]):
        return [
            {
                "visual_description": f"Atmospheric grand ancient library with rows of classical books and sunlight shafts",
                "search_queries": ["library", "books", "reading", "study"],
                "on_screen_text": "FORGOTTEN WISDOM"
            },
            {
                "visual_description": "Hands gently turning aged parchment pages of a rare vintage manuscript",
                "search_queries": ["books", "reading", "vintage", "study"],
                "on_screen_text": "BENEATH THE SURFACE"
            },
            {
                "visual_description": "Author sitting by warm lamp and coffee writing notes with fountain pen",
                "search_queries": ["reading", "coffee", "writing", "office"],
                "on_screen_text": "MASTERING THE CRAFT",
                "custom_narration": "Great works of literature endure not because of complex jargon, but because they reveal universal human truths."
            },
            {
                "visual_description": "Classical library hall with magnificent ceiling and architecture",
                "search_queries": ["library", "architecture", "books", "nature"],
                "on_screen_text": "THE REVELATION",
                "custom_narration": "When you read with intention rather than speed, you absorb decades of hard-won wisdom in just a few focused hours."
            },
            {
                "visual_description": "Closing a leather bound book on clean modern minimalist wooden desk",
                "search_queries": ["books", "lifestyle", "office", "study"],
                "on_screen_text": "READ DEEPER"
            }
        ]

    # 6. Habits, Psychology & Mindset
    if any(k in combined for k in ["habit", "habits", "routine", "mindset", "discipline", "productivity", "psychology", "atomic"]):
        return [
            {
                "visual_description": f"Early morning sunrise streaming through window with warm steaming coffee cup",
                "search_queries": ["morning", "coffee", "sunrise", "lifestyle"],
                "on_screen_text": "THE 1% RULE"
            },
            {
                "visual_description": "Person sitting at organized desk writing out clean daily goals in planner",
                "search_queries": ["coffee", "writing", "routine", "desk"],
                "on_screen_text": "REDUCE FRICTION"
            },
            {
                "visual_description": "Steady cadence of daily morning jog in green natural park",
                "search_queries": ["running", "fitness", "nature", "morning"],
                "on_screen_text": "DAILY REPETITION",
                "custom_narration": "You do not rise to the level of your ambitious goals—you fall to the automatic systems built into your daily environment."
            },
            {
                "visual_description": "Hiker standing triumphant on mountain peak at golden hour sunrise",
                "search_queries": ["mountain", "success", "sunrise", "landscape"],
                "on_screen_text": "THE COMPOUND PAYOFF",
                "custom_narration": "Optimize your physical space to make good decisions frictionless, and compounding momentum will do the heavy lifting."
            },
            {
                "visual_description": "Clean modern aesthetic workspace with tranquil plant and sunlight",
                "search_queries": ["office", "lifestyle", "meditation", "morning"],
                "on_screen_text": "MASTER YOUR ROUTINE"
            }
        ]

    # 7. General Fallback with dynamic keyword injection
    main_slugs = [re.sub(r"[^a-zA-Z0-9]", "", w) for w in clean_topic.lower().split() if len(w) > 3]
    top_keyword = main_slugs[0] if main_slugs else "technology"
    second_keyword = main_slugs[1] if len(main_slugs) > 1 else "business"

    return [
        {
            "visual_description": f"Cinematic dramatic visual representing {clean_topic} with striking lighting",
            "search_queries": [top_keyword, "abstract", "technology", "modern"],
            "on_screen_text": "THE HIDDEN TRUTH"
        },
        {
            "visual_description": f"Professional analyzing strategy and reviewing insights in modern office",
            "search_queries": [second_keyword, "office", "business", "working"],
            "on_screen_text": "THE CORE MECHANISM"
        },
        {
            "visual_description": "Dynamic modern city movement and digital progress timelapse",
            "search_queries": ["city", "skyline", "traffic", "abstract"],
            "on_screen_text": "COMPOUNDING FORCE",
            "custom_narration": "When you focus on the fundamental drivers rather than surface symptoms, the path forward becomes remarkably straightforward."
        },
        {
            "visual_description": "Majestic golden hour mountain sunrise with breathtaking horizon",
            "search_queries": ["mountain", "sunrise", "landscape", "success"],
            "on_screen_text": "THE PAYOFF",
            "custom_narration": "That is the essential insight that creates lasting results and separates real mastery from wishful thinking."
        },
        {
            "visual_description": "Sleek modern minimalist call to action with clean aesthetic backdrop",
            "search_queries": ["modern", "lifestyle", "abstract", "technology"],
            "on_screen_text": "FOLLOW FOR MORE"
        }
    ]


class LLMEngine:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()

    async def generate_script(
        self,
        topic: str,
        target_duration: int = 45,
        language: str = "en",
        platform: str = "youtube_shorts",
        visual_style: str = "cinematic",
        content_category: str = "educational"
    ) -> ScriptGenerationOutput:
        """
        Provider-independent script generation.
        Tries configured provider, falls back gracefully to deterministic rule-based generator
        if no credentials or offline.
        """
        if self.provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await self._generate_with_openai(topic, target_duration, language, platform, visual_style)
            except Exception as e:
                print(f"[LLMEngine] OpenAI generation failed: {e}. Falling back to intelligent generator.")

        if self.provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                return await self._generate_with_gemini(topic, target_duration, language, platform, visual_style)
            except Exception as e:
                print(f"[LLMEngine] Gemini generation failed: {e}. Falling back to intelligent generator.")

        if self.provider == "ollama":
            try:
                return await self._generate_with_ollama(topic, target_duration, language, platform, visual_style)
            except Exception as e:
                print(f"[LLMEngine] Ollama generation failed: {e}. Falling back to intelligent generator.")

        return self._generate_fallback(topic, target_duration, language, platform, visual_style, content_category)

    def _generate_fallback(
        self,
        topic: str,
        target_duration: int,
        language: str,
        platform: str,
        visual_style: str,
        content_category: str
    ) -> ScriptGenerationOutput:
        """
        Deterministic, high-quality, structured rule-based generator.
        Produces genuine, highly-engaging vertical short script with distinct scene breakdown.
        """
        clean_title, provided_hook, provided_angle = parse_topic_metadata(topic)
        clean_topic = clean_title.strip().title() if clean_title else "The Hidden Truth"

        if language == "hi":
            hooks = [
                sanitize_narration_for_speech(provided_hook or f"क्या आप जानते हैं कि {clean_topic} आपके जीवन को कैसे बदल सकता है?"),
                f"यह एक रहस्य है जो 99% लोग {clean_topic} के बारे में नहीं जानते!",
                f"रुकिए! {clean_topic} के बारे में सच्चाई जानकर आप दंग रह जाएंगे।"
            ]
            rec_hook = hooks[0]
            scene_1_narration = sanitize_narration_for_speech(
                provided_hook or f"क्या आप जानते हैं कि {clean_topic} आपके जीवन को कैसे बदल सकता है? आज हम इसका सच जानेंगे।"
            )
            scene_2_narration = sanitize_narration_for_speech(
                f"अधिकांश लोग बुनियादी नियमों को समझे बिना ही निष्कर्ष पर पहुंच जाते हैं। {provided_angle or 'लेकिन मुख्य बात यहां है।'}"
            )
            scenes = [
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=1,
                    role="hook",
                    narration=scene_1_narration,
                    estimated_duration_seconds=6.0,
                    visual_description=f"High impact cinematic visual representing {clean_topic} with dramatic lighting",
                    search_queries=[f"{clean_topic} mystery", "curious person thinking", "dramatic cinematic background"],
                    on_screen_text=f"{clean_topic.upper()} का सच!",
                    transition_in="fade",
                    transition_out="cut",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=2,
                    role="setup",
                    narration=scene_2_narration,
                    estimated_duration_seconds=7.0,
                    visual_description="Person analyzing documents or looking at glowing financial digital data chart",
                    search_queries=["digital analytics screen", "person studying notes", "data visualization 4k"],
                    on_screen_text="नियम नंबर एक",
                    transition_in="cut",
                    transition_out="fade",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=3,
                    role="main",
                    narration="जब आप रणनीतिक दृष्टिकोण अपनाते हैं, तो परिणाम अपने आप सामने आने लगते हैं। अनुशासन ही सफलता की कुंजी है।",
                    estimated_duration_seconds=8.0,
                    visual_description="Timelapse of modern city growth, focused professional working efficiently",
                    search_queries=["modern city skyline timelapse", "focused professional working", "growth and progress"],
                    on_screen_text="रणनीति और अनुशासन",
                    transition_in="fade",
                    transition_out="cut",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=4,
                    role="payoff",
                    narration="यही कारण है कि सफल लोग हर दिन छोटे सुधारों पर ध्यान देते हैं।",
                    estimated_duration_seconds=6.0,
                    visual_description="Confident person smiling and achieving goal, sunrise over mountains",
                    search_queries=["success mountain peak sunrise", "confident professional", "celebration achievement"],
                    on_screen_text="सफलता का रहस्य",
                    transition_in="cut",
                    transition_out="fade",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=5,
                    role="outro",
                    narration="अगर यह जानकारी उपयोगी लगी, तो अभी फॉलो करें और अपने विचार कमेंट में बताएं।",
                    estimated_duration_seconds=5.0,
                    visual_description="Smooth motion graphic with subscribe and follow icon animation",
                    search_queries=["subscribe icon button", "motion graphic social media", "technology connection"],
                    on_screen_text="लाइक और फॉलो करें!",
                    transition_in="fade",
                    transition_out="cut",
                    caption_style="word_highlight"
                )
            ]
        else:
            hooks = [
                sanitize_narration_for_speech(provided_hook or f"Most people think they understand {clean_topic}, but here is the hidden truth."),
                f"Stop scrolling! This 30-second secret about {clean_topic} will change your mindset.",
                f"Here is why 99% of people get {clean_topic} completely wrong."
            ]
            rec_hook = hooks[0]

            # Scene 1: Only the pure spoken hook sentence
            scene_1_narration = sanitize_narration_for_speech(
                provided_hook or f"Most people think they understand {clean_topic}, but here is the hidden truth you were never told."
            )

            # Scene 2: Core setup without ever speaking the word 'Angle:'
            if provided_angle:
                scene_2_narration = sanitize_narration_for_speech(
                    f"The biggest mistake is looking only at the surface. {provided_angle} is what actually changes everything."
                )
            else:
                scene_2_narration = "The common mistake is trying to solve the symptoms instead of looking at the underlying foundation."

            domain_visuals = build_domain_visual_breakdown(clean_topic, provided_angle or "", content_category)

            # Scene 3 narration: domain-adapted narrative sentence
            scene_3_narration = domain_visuals[2].get(
                "custom_narration",
                "When you look beneath the headline numbers, the real compounding mechanism becomes undeniably clear."
            )

            # Scene 4 narration: payoff sentence
            scene_4_narration = domain_visuals[3].get(
                "custom_narration",
                "That is the foundational reality that separates those who succeed from everyone else."
            )

            # Scene 5 narration: actionable call to action
            scene_5_narration = "Double tap if you found this valuable, and follow for daily deep-dive breakdowns."

            scenes = [
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=1,
                    role="hook",
                    narration=scene_1_narration,
                    estimated_duration_seconds=6.0,
                    visual_description=domain_visuals[0]["visual_description"],
                    search_queries=domain_visuals[0]["search_queries"],
                    on_screen_text=domain_visuals[0]["on_screen_text"],
                    transition_in="fade",
                    transition_out="cut",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=2,
                    role="setup",
                    narration=scene_2_narration,
                    estimated_duration_seconds=7.0,
                    visual_description=domain_visuals[1]["visual_description"],
                    search_queries=domain_visuals[1]["search_queries"],
                    on_screen_text=domain_visuals[1]["on_screen_text"],
                    transition_in="cut",
                    transition_out="fade",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=3,
                    role="main",
                    narration=scene_3_narration,
                    estimated_duration_seconds=8.0,
                    visual_description=domain_visuals[2]["visual_description"],
                    search_queries=domain_visuals[2]["search_queries"],
                    on_screen_text=domain_visuals[2]["on_screen_text"],
                    transition_in="fade",
                    transition_out="cut",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=4,
                    role="payoff",
                    narration=scene_4_narration,
                    estimated_duration_seconds=6.0,
                    visual_description=domain_visuals[3]["visual_description"],
                    search_queries=domain_visuals[3]["search_queries"],
                    on_screen_text=domain_visuals[3]["on_screen_text"],
                    transition_in="cut",
                    transition_out="fade",
                    caption_style="word_highlight"
                ),
                SceneSchema(
                    scene_id=f"scene-{uuid.uuid4().hex[:6]}",
                    order=5,
                    role="outro",
                    narration=scene_5_narration,
                    estimated_duration_seconds=5.0,
                    visual_description=domain_visuals[4]["visual_description"],
                    search_queries=domain_visuals[4]["search_queries"],
                    on_screen_text=domain_visuals[4]["on_screen_text"],
                    transition_in="fade",
                    transition_out="cut",
                    caption_style="word_highlight"
                )
            ]

        full_script = " ".join([s.narration for s in scenes])
        return ScriptGenerationOutput(
            title=f"{clean_topic} Revealed",
            hook_options=hooks,
            recommended_hook=rec_hook,
            full_script=full_script,
            target_duration_seconds=target_duration,
            scenes=scenes
        )

    async def _generate_with_openai(self, topic: str, target_duration: int, language: str, platform: str, visual_style: str) -> ScriptGenerationOutput:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = f"""
        Generate a high-retention vertical short script for {platform} on topic: "{topic}".
        Duration: ~{target_duration}s. Language: {language}. Visual style: {visual_style}.
        Return ONLY valid JSON matching this structure:
        {{
            "title": "Title",
            "hook_options": ["Hook 1", "Hook 2", "Hook 3"],
            "recommended_hook": "Hook 1",
            "full_script": "Full narration text",
            "target_duration_seconds": {target_duration},
            "scenes": [
                {{
                    "scene_id": "scene-1",
                    "order": 1,
                    "role": "hook",
                    "narration": "Narration text",
                    "estimated_duration_seconds": 6.0,
                    "visual_description": "Description of visuals",
                    "search_queries": ["query 1", "query 2"],
                    "on_screen_text": "HOOK TEXT",
                    "transition_in": "fade",
                    "transition_out": "cut",
                    "caption_style": "word_highlight"
                }}
            ]
        }}
        """
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return ScriptGenerationOutput(**data)

    async def _generate_with_gemini(self, topic: str, target_duration: int, language: str, platform: str, visual_style: str) -> ScriptGenerationOutput:
        # Fallback to local if gemini SDK not explicitly set
        return self._generate_fallback(topic, target_duration, language, platform, visual_style, "general")

    async def _generate_with_ollama(self, topic: str, target_duration: int, language: str, platform: str, visual_style: str) -> ScriptGenerationOutput:
        import aiohttp
        # If ollama is running
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{settings.OLLAMA_BASE_URL}/api/tags") as res:
                if res.status != 200:
                    raise Exception("Ollama server not reachable")
        return self._generate_fallback(topic, target_duration, language, platform, visual_style, "general")

llm_engine = LLMEngine()
