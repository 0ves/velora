import React, { useState, useEffect, useRef, useCallback } from 'react';

// GSAP is loaded via CDN link in the script tags, but we'll use a placeholder for type-checking simplicity
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

// --- Gemini API Configuration (Leave API Key empty string) ---
const API_KEY = "";
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const MAX_RETRIES = 5;

// -- Asset Paths --
const LOGO_URL = "uploaded:505445610_17858798805431838_1484203170803331062_n.png";
const HERO_VIDEO_URL = "uploaded:Here’s a glimpse of our new menu fresh flavours, delicious food, and exciting drinks. So what ar.mp4";
const CABANA_VIDEO_URL = "uploaded:AQOqD7P_mmEyjljxSnTZsk-mvJ3H4vXuD9KnKVnrOob-ZBrfVLT8YM8GUaH12TK0sXO7vzC-31p_tznHeoBCnAaGpzJIHihG.mp4";

const GALLERY_IMAGES = [
    { src: "uploaded:561608745_17873472837431838_3326580581267148127_n.jpg", alt: "Kebabs, Tacos, and Fries Platter" },
    { src: "uploaded:573001931_17876058801431838_8370660066202517075_n.jpg", alt: "Pasta and Cocktail" },
    { src: "uploaded:548506390_17870710887431838_195847414132898983_n.jpg", alt: "Dessert, Risotto, and Cocktails" },
    { src: "uploaded:542809766_17869698753431838_8946627928477139954_n.jpg", alt: "Cocktail, Pasta, and Potatoes" },
    { src: "uploaded:560103056_17873157831431838_5167209182513894048_n.jpg", alt: "Tacos on a wooden board" },
    { src: "uploaded:556338641_17872484481431838_1473327261380910719_n.jpg", alt: "Night Ambiance and Bar" },
    { src: "uploaded:564333854_17873775048431838_6418911193708098460_n.jpg", alt: "Private Cabana Seating" },
];

// --- Gemini Fetcher Utility ---
const GeminiFetcher = async (payload) => {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API responded with status ${response.status}: ${JSON.stringify(errorBody)}`);
            }

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!jsonText) {
                throw new Error("Received an empty or malformed response from the LLM.");
            }

            // The structured response is a JSON string, so we must parse it
            return JSON.parse(jsonText);
            
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES - 1) {
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error("GeminiFetcher failed after all retries:", lastError);
    throw new Error(`Failed to communicate with the AI service. Please try again later. Details: ${lastError.message}`);
};

// --- Sub-Components ---

// Event Planner Modal Component (Gemini Powered)
const EventPlannerModal = ({ isOpen, onClose }) => {
    const [eventType, setEventType] = useState('Birthday');
    const [guests, setGuests] = useState(10);
    const [vibe, setVibe] = useState('Sophisticated, intimate, and celebratory');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closing
            setResult(null);
            setError(null);
            setIsLoading(false);
        }
        if (gsap) {
            gsap.to(".event-modal", {
                duration: 0.5,
                y: isOpen ? "0%" : "100%",
                opacity: isOpen ? 1 : 0,
                ease: "power3.inOut"
            });
            document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleGenerateVibe = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const systemPrompt = "You are a world-class luxury event planner for a high-end rooftop restaurant called Velora. Your goal is to generate elegant, sophisticated, and creative suggestions for private dining events based on user input. Respond with only a JSON object.";
        
        const userQuery = `Generate a creative event suggestion for: Event Type: ${eventType}, Guests: ${guests} people, Vibe/Keywords: ${vibe}. Focus on a high-end, elegant execution for a Pune rooftop.`;
        
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        themeSuggestion: { type: "STRING", description: "A one-line creative theme name." },
                        themeDescription: { type: "STRING", description: "A short, elegant description of the theme, 2 sentences max." },
                        signatureCocktail: { type: "STRING", description: "A creative name for a signature cocktail." },
                        cocktailRecipeIdea: { type: "STRING", description: "A brief description of the cocktail ingredients/flavor, 1 sentence." },
                        invitationDraft: { type: "STRING", description: "A short, elegant draft of an invitation message, 3 sentences max." },
                    },
                    required: ["themeSuggestion", "themeDescription", "signatureCocktail", "cocktailRecipeIdea", "invitationDraft"],
                }
            }
        };

        try {
            const data = await GeminiFetcher(payload);
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const ResultDisplay = ({ result }) => (
        <div className="space-y-8 mt-10 p-6 bg-velora-bg rounded-xl shadow-inner border border-velora-primary/50">
            <h3 className="font-serif text-3xl text-velora-dark text-center">Your Custom Velora Vibe</h3>

            <div>
                <p className="font-sans text-xs uppercase tracking-widest text-velora-primary mb-1">Theme Suggestion</p>
                <h4 className="font-serif text-4xl text-velora-dark mb-2">{result.themeSuggestion}</h4>
                <p className="font-sans text-sm text-velora-dark/80">{result.themeDescription}</p>
            </div>

            <div>
                <p className="font-sans text-xs uppercase tracking-widest text-velora-primary mb-1">Signature Cocktail</p>
                <h4 className="font-serif text-2xl text-velora-dark mb-2">{result.signatureCocktail}</h4>
                <p className="font-sans text-sm text-velora-dark/80">{result.cocktailRecipeIdea}</p>
            </div>

            <div>
                <p className="font-sans text-xs uppercase tracking-widest text-velora-primary mb-1">Draft Invitation</p>
                <div className="p-4 bg-white border border-gray-200 rounded-lg italic text-velora-dark/90">
                    <p className="whitespace-pre-wrap font-serif text-base">{result.invitationDraft}</p>
                </div>
            </div>

        </div>
    );


    if (!isOpen) return null;

    return (
        <div 
            className={`event-modal fixed inset-0 z-50 overflow-y-auto bg-velora-bg/95 backdrop-blur-sm p-4 md:p-12 transform translate-y-full opacity-0`}
            onClick={onClose}
        >
            <div 
                className="bg-white border border-velora-primary/50 max-w-3xl mx-auto rounded-xl shadow-2xl my-8 p-6 md:p-10"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-8">
                    <h2 className="font-serif text-4xl md:text-5xl text-velora-primary tracking-wider">
                        Event Vibe Generator ✨
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-velora-dark text-3xl hover:text-red-600 transition-colors p-2 rounded-full border border-transparent hover:border-red-400"
                        aria-label="Close Event Planner"
                    >
                        &times;
                    </button>
                </div>
                
                <p className="text-velora-dark text-lg mb-8 border-b border-velora-primary/20 pb-4 font-sans">
                    Let Gemini create a bespoke theme, cocktail, and invitation draft for your private dining experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 font-sans">
                    <div>
                        <label className="block text-sm font-medium text-velora-dark mb-1">Event Type</label>
                        <select 
                            value={eventType} 
                            onChange={(e) => setEventType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-velora-primary focus:border-velora-primary"
                        >
                            <option>Birthday</option>
                            <option>Anniversary</option>
                            <option>Corporate</option>
                            <option>Engagement</option>
                            <option>Other Celebration</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-velora-dark mb-1">Number of Guests (Max 30)</label>
                        <input 
                            type="number" 
                            value={guests} 
                            onChange={(e) => setGuests(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                            min="1"
                            max="30"
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-velora-primary focus:border-velora-primary"
                        />
                    </div>
                </div>

                <div className="mb-6 font-sans">
                    <label className="block text-sm font-medium text-velora-dark mb-1">Desired Vibe / Keywords</label>
                    <textarea 
                        value={vibe} 
                        onChange={(e) => setVibe(e.target.value)}
                        rows="3"
                        placeholder="e.g., 'Loud dance party, quiet romance, professional networking, classic Indian food focus'"
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-velora-primary focus:border-velora-primary"
                    ></textarea>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <button 
                    onClick={handleGenerateVibe} 
                    disabled={isLoading}
                    className="w-full py-3 bg-velora-primary hover:opacity-80 text-velora-dark font-bold rounded-lg shadow-xl transition duration-300 uppercase text-lg tracking-wider disabled:opacity-50 flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-velora-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Vibe...
                        </>
                    ) : (
                        "Generate Vibe Now ✨"
                    )}
                </button>
                
                {result && <ResultDisplay result={result} />}

                <button 
                    onClick={onClose} 
                    className="mt-8 w-full py-2 border border-velora-dark text-velora-dark hover:bg-velora-dark hover:text-white font-sans rounded-lg transition duration-300"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// Menu Modal Component (Static)
const MenuModal = ({ isOpen, onClose }) => {
    // Dummy menu data
    const menuData = [
        {
            category: "Velora Signature Cocktails",
            items: [
                { name: "The Skyfall", description: "Gin, elderflower, blue curacao, lime, and mint with a sea salt rim." },
                { name: "Pune Sunset", description: "A tropical blend of dark rum, passion fruit, orange, and grenadine." },
                { name: "Espresso Rendezvous", description: "Vodka, fresh espresso, coffee liqueur, and a hint of dark chocolate." },
            ]
        },
        {
            category: "Small Plates & Appetizers",
            items: [
                { name: "Spicy Chorizo Tacos", description: "Crispy mini corn tortillas, slow-cooked chorizo, and a smoky chipotle glaze." },
                { name: "Truffle Arancini", description: "Saffron risotto balls stuffed with mozzarella and black truffle, served with marinara." },
                { name: "Pesto Paneer Skewers", description: "Grilled cottage cheese marinated in homemade basil pesto." },
            ]
        },
        {
            category: "Main Course",
            items: [
                { name: "Rooftop Ravioli", description: "Handmade tortellini tossed in a rich tomato and basil cream sauce." },
                { name: "Sizzler Platter", description: "A selection of grilled meats or vegetables served on a hot plate with signature sauces." },
                { name: "Butter Chicken Risotto", description: "Creamy arborio rice infused with the flavors of classic Indian Butter Chicken." },
            ]
        }
    ];

    useEffect(() => {
        if (gsap) {
            gsap.to(".menu-modal", {
                duration: 0.5,
                y: isOpen ? "0%" : "100%",
                opacity: isOpen ? 1 : 0,
                ease: "power3.inOut"
            });
            // Disable body scroll when modal is open
            document.body.style.overflow = isOpen ? 'hidden' : 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto'; // Re-enable scroll on unmount/cleanup
        };
    }, [isOpen]);

    if (!isOpen && document.body.style.overflow !== 'auto') {
        return null;
    }

    return (
        <div 
            className={`menu-modal fixed inset-0 z-50 overflow-y-auto bg-velora-bg/95 backdrop-blur-sm p-4 md:p-12 transform translate-y-full opacity-0 ${isOpen ? '' : 'pointer-events-none'}`}
            onClick={onClose} // Close on backdrop click
            style={{ WebkitOverflowScrolling: 'touch' }} // Improve mobile scrolling
        >
            <div 
                className="bg-white border border-velora-primary/50 max-w-4xl mx-auto rounded-xl shadow-2xl my-8 p-6 md:p-10"
                onClick={e => e.stopPropagation()} // Prevent modal close when clicking inside
            >
                <div className="flex justify-between items-start mb-8">
                    <h2 className="font-serif text-5xl md:text-6xl text-velora-primary tracking-wider">The Menu</h2>
                    <button 
                        onClick={onClose} 
                        className="text-velora-dark text-3xl hover:text-red-600 transition-colors p-2 rounded-full border border-transparent hover:border-red-400"
                        aria-label="Close Menu"
                    >
                        &times;
                    </button>
                </div>
                
                <p className="text-velora-dark text-lg mb-10 border-b border-velora-primary/20 pb-4 font-sans">
                    A curated selection of global flavors and signature cocktails, designed for the perfect rooftop experience.
                </p>

                {menuData.map((section, index) => (
                    <div key={index} className="mb-10">
                        <h3 className="font-sans text-2xl font-light text-velora-dark mb-4 border-b border-velora-primary/50 pb-2 uppercase tracking-widest">
                            {section.category}
                        </h3>
                        <div className="space-y-4">
                            {section.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex flex-col md:flex-row justify-between pt-2">
                                    <h4 className="font-serif text-xl text-velora-primary flex-shrink-0 mb-1 md:mb-0">
                                        {item.name}
                                    </h4>
                                    <span className="hidden md:block border-b border-dashed border-velora-primary/30 mx-4 flex-grow my-auto"></span>
                                    <p className="text-velora-dark text-sm italic flex-grow md:text-right max-w-lg font-sans">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <button 
                    onClick={onClose} 
                    className="mt-8 w-full py-3 bg-velora-primary hover:opacity-80 text-velora-dark font-bold rounded-lg shadow-xl transition duration-300 font-sans"
                >
                    Back to Velora
                </button>
            </div>
        </div>
    );
};

// Navbar Component
const Navbar = ({ toggleMenu }) => {
    const navRef = useRef(null);

    useEffect(() => {
        if (gsap) {
            // Slower, more elegant entrance
            gsap.from(navRef.current, {
                y: -100,
                opacity: 0,
                duration: 1.5,
                delay: 0.5,
                ease: "power3.out"
            });
        }
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80, // Offset for fixed navbar
                behavior: 'smooth'
            });
        }
    };

    return (
        <nav ref={navRef} className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm shadow-md p-4 md:px-12">
            <div className="flex justify-between items-center max-w-screen-xl mx-auto">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
                    <img src={LOGO_URL} alt="Velora Logo" className="h-10 md:h-12 w-auto" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x40/262626/e7caa9?text=VELORA"; }} />
                </div>
                
                <div className="flex space-x-6 items-center">
                    {/* Use the elegant serif font for nav links */}
                    {['Experience', 'Gallery', 'Contact'].map(section => (
                        <button
                            key={section}
                            onClick={() => scrollToSection(section.toLowerCase())}
                            className="text-xl font-serif text-velora-dark hover:text-velora-primary transition-colors duration-300 hidden sm:block"
                        >
                            {section}
                        </button>
                    ))}
                    
                    <button 
                        onClick={toggleMenu} 
                        className="px-6 py-2 bg-velora-primary text-velora-dark font-bold rounded-full hover:opacity-80 transition duration-300 shadow-lg uppercase text-sm tracking-wider font-sans"
                    >
                        Menu
                    </button>
                </div>
            </div>
        </nav>
    );
};

// Hero Section Component
const HeroSection = ({ openMenu }) => {
    const headlineRef = useRef(null);
    const sublineRefTop = useRef(null);
    const sublineRefBottom = useRef(null);
    const ctaRef = useRef(null);
    const heroRef = useRef(null); // Ref for the whole section for parallax

    useEffect(() => {
        if (gsap && ScrollTrigger) {
            // GSAP Animation for Hero Text (Slower, more luxurious entrance)
            gsap.from([sublineRefTop.current, headlineRef.current, sublineRefBottom.current, ctaRef.current], {
                opacity: 0,
                y: 50,
                stagger: 0.4, // Increased stagger for a slower reveal
                duration: 1.5, // Increased duration
                delay: 1.2,
                ease: "power3.out"
            });
            
            // Subtle Parallax effect on the entire Hero section for depth
            gsap.to(heroRef.current.querySelector('video'), {
                yPercent: 10, // Move video down 10%
                ease: "none",
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: "top top", // start effect immediately
                    end: "bottom top", // end when the section leaves the viewport
                    scrub: true, // smooth animation on scroll
                }
            });
        }
    }, []);

    return (
        <section id="hero" ref={heroRef} className="relative h-screen w-full overflow-hidden">
            {/* The video element itself is what gets the parallax in the useEffect */}
            <video 
                className="absolute inset-0 w-full h-full object-cover" 
                autoPlay 
                loop 
                muted 
                playsInline
                poster="https://placehold.co/1920x1080/fcf8f3/262626?text=Loading+Velora+Video"
            >
                <source src={HERO_VIDEO_URL} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            
            <div className="absolute inset-0 bg-velora-bg/30 flex flex-col justify-center items-center text-center p-6">
                <p ref={sublineRefTop} className="text-xl md:text-2xl text-velora-dark font-light tracking-widest uppercase mb-4 font-sans">
                    Rooftop Grandeur in Pune
                </p>
                <h1 ref={headlineRef} className="font-serif text-7xl md:text-9xl text-velora-dark tracking-tight leading-none">
                    Velora
                </h1>
                <p ref={sublineRefBottom} className="text-2xl md:text-3xl text-velora-primary font-serif italic mt-4 mb-10 max-w-4xl">
                    Where Great Food meets Premium Ambience.
                </p>
                
                <div ref={ctaRef} className="space-x-4">
                    <button 
                        onClick={() => window.location.href = 'https://www.google.com/maps/place/Velora+Rooftop/'}
                        className="px-8 py-3 bg-velora-primary text-velora-dark font-bold rounded-full hover:opacity-80 transition duration-300 shadow-xl uppercase text-lg tracking-wider font-sans"
                    >
                        Book A Table
                    </button>
                    <button 
                        onClick={openMenu} 
                        className="px-8 py-3 border border-velora-primary text-velora-dark font-bold rounded-full hover:bg-velora-primary/10 transition duration-300 uppercase text-lg tracking-wider font-sans"
                    >
                        View Menu
                    </button>
                </div>
            </div>
        </section>
    );
};

// About/Experience Section Component
const ExperienceSection = ({ openEventPlanner }) => {
    const cabanaRef = useRef(null);
    const textRef = useRef(null);
    const sectionRef = useRef(null); // Ref for the entire section

    useEffect(() => {
        if (gsap && ScrollTrigger) {
            // ScrollTrigger for Cabana Video container (Initial fade-in)
            gsap.from(cabanaRef.current, {
                scrollTrigger: {
                    trigger: cabanaRef.current,
                    start: "top bottom-=100",
                    toggleActions: "play none none none",
                },
                opacity: 0,
                y: 50,
                duration: 1.8, // Slower entrance
                ease: "power3.out"
            });

            // Parallax effect on the video container
            gsap.to(cabanaRef.current, {
                yPercent: -15, // Move up slightly on scroll
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                }
            });

            // ScrollTrigger for Text (Slower, more elegant entrance)
            gsap.from(textRef.current, {
                scrollTrigger: {
                    trigger: textRef.current,
                    start: "top bottom-=100",
                    toggleActions: "play none none none",
                },
                opacity: 0,
                x: -50,
                duration: 1.8, // Slower entrance
                delay: 0.5,
                ease: "power3.out"
            });
        }
    }, []);

    return (
        <section id="experience" ref={sectionRef} className="py-16 md:py-24 bg-velora-bg text-velora-dark overflow-hidden">
            <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    
                    <div ref={textRef}>
                        <h2 className="font-serif text-5xl md:text-7xl text-velora-primary mb-6">
                            The Velora Experience
                        </h2>
                        <p className="text-xl text-velora-dark mb-6 font-light font-serif">
                            Elevate your evening at Pune's premier open-air destination. Velora offers more than just a meal—it’s an escape. With breathtaking views and a sophisticated atmosphere, every visit is a special occasion.
                        </p>
                        <p className="text-lg text-velora-dark/80 leading-relaxed mb-8 font-sans">
                            Discover our signature private cabanas, draped in elegant linen and surrounded by lush greenery, providing an intimate setting perfect for celebrations or quiet moments. It’s where time slows and stories start.
                        </p>
                        <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
                            <a href="#contact" className="inline-block px-6 py-2 border border-velora-primary text-velora-primary font-bold rounded-full hover:bg-velora-primary hover:text-white transition duration-300 uppercase text-sm tracking-wider font-sans text-center">
                                Explore Private Dining
                            </a>
                             {/* New Gemini-powered button */}
                            <button 
                                onClick={openEventPlanner}
                                className="inline-block px-6 py-2 bg-velora-primary text-velora-dark font-bold rounded-full hover:opacity-80 transition duration-300 uppercase text-sm tracking-wider font-sans text-center shadow-lg"
                            >
                                Generate Your Event Vibe ✨
                            </button>
                        </div>
                    </div>

                    <div ref={cabanaRef} className="rounded-xl overflow-hidden shadow-2xl relative h-[60vh]">
                        <video 
                            className="absolute inset-0 w-full h-full object-cover" 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            poster="https://placehold.co/1920x1080/fcf8f3/262626?text=Velora+Cabanas"
                        >
                            <source src={CABANA_VIDEO_URL} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </div>
        </section>
    );
};


const GallerySection = () => {
    const galleryRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        if (gsap && ScrollTrigger) {
            // GSAP ScrollTrigger for title
            gsap.from(titleRef.current, {
                scrollTrigger: {
                    trigger: titleRef.current,
                    start: "top bottom-=200",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: -50,
                duration: 1.5,
                ease: "power3.out"
            });
            
            // GSAP ScrollTrigger for gallery items with initial fade and parallax
            gsap.utils.toArray(galleryRef.current.children).forEach((card, i) => {
                const img = card.querySelector('img');

                // Initial Fade-in animation
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top bottom-=150",
                        toggleActions: "play none none none"
                    },
                    opacity: 0,
                    y: 50,
                    duration: 1.5,
                    delay: i * 0.15, // Slightly increased stagger
                    ease: "power3.out"
                });

                // Subtle Image Parallax (only 10px movement)
                gsap.to(img, {
                    y: 10,
                    ease: "none",
                    scrollTrigger: {
                        trigger: card,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true,
                    },
                });
            });
        }
    }, []);
    
    // Shuffle images for a non-sequential feel
    const shuffledImages = GALLERY_IMAGES.sort(() => 0.5 - Math.random());

    return (
        <section id="gallery" className="py-16 md:py-24 bg-white text-velora-dark">
            <div className="max-w-screen-xl mx-auto px-6 md:px-12">
                <h2 ref={titleRef} className="font-serif text-center text-6xl md:text-7xl text-velora-primary mb-12">
                    Culinary Odyssey
                </h2>
                
                <div ref={galleryRef} className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {shuffledImages.map((image, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg shadow-xl group cursor-pointer">
                            <img 
                                src={image.src} 
                                alt={image.alt} 
                                // Make the image slightly larger to accommodate the parallax movement without revealing background
                                className="w-full h-[110%] object-cover transform group-hover:scale-[1.05] transition duration-500 ease-in-out" 
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/e7caa9/262626?text=Image+Loading+Error`; }}
                                style={{ transformOrigin: 'center top' }} // Adjust transform origin for a cleaner look
                            />
                            <div className="absolute inset-0 bg-velora-dark/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                <span className="text-white text-base font-bold uppercase tracking-wider p-2 bg-velora-dark/50 rounded-md font-sans">
                                    {image.alt.split(',')[0]}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Footer/Contact Section Component
const FooterSection = () => {
    const footerRef = useRef(null);

    useEffect(() => {
        if (gsap && ScrollTrigger) {
            // GSAP fade-up animation for each column
            gsap.utils.toArray(footerRef.current.children).forEach((col, i) => {
                gsap.from(col, {
                    scrollTrigger: {
                        trigger: col,
                        start: "top bottom-=100",
                        toggleActions: "play none none none"
                    },
                    opacity: 0,
                    y: 30,
                    duration: 1.2,
                    delay: i * 0.25, // Slower stagger
                    ease: "power2.out"
                });
            });
        }
    }, []);

    return (
        <footer id="contact" className="bg-velora-dark text-white py-12 md:py-20">
            <div ref={footerRef} className="max-w-screen-xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* Brand Info */}
                <div>
                    <img src={LOGO_URL} alt="Velora Logo" className="h-10 mb-4" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x40/262626/e7caa9?text=VELORA"; }} />
                    <p className="text-sm text-stone-300 font-sans">
                        Experience the heights of dining. Velora Rooftop is Pune's premier destination for exquisite food, signature cocktails, and unmatched ambience.
                    </p>
                </div>
                
                {/* Location */}
                <div>
                    <h4 className="font-serif text-xl text-white mb-4 border-b border-velora-primary inline-block">Location</h4>
                    <p className="text-sm leading-relaxed text-stone-300 font-sans">
                        Velora Rooftop – Great Food & Premium Ambience in Pune
                        <br />
                        Kharadi, Pune, Maharashtra 411014, India
                    </p>
                    <a 
                        href="https://www.google.com/maps/place/Velora+Rooftop/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-velora-primary hover:text-white transition duration-300 font-sans"
                    >
                        Get Directions
                    </a>
                </div>

                {/* Hours */}
                <div>
                    <h4 className="font-serif text-xl text-white mb-4 border-b border-velora-primary inline-block">Hours</h4>
                    <p className="text-sm text-stone-300 font-sans">
                        **Dinner Service**
                        <br />
                        Mon - Sun: 5:00 PM – 1:00 AM
                        <br /><br />
                        **Reservations Highly Recommended**
                    </p>
                </div>

                {/* Social & Contact */}
                <div>
                    <h4 className="font-serif text-xl text-white mb-4 border-b border-velora-primary inline-block">Connect</h4>
                    <div className="flex space-x-4 text-2xl">
                        <a href="#" className="hover:text-velora-primary transition-colors" aria-label="Instagram">
                            <i className="fa-brands fa-instagram"></i>
                        </a>
                        <a href="#" className="hover:text-velora-primary transition-colors" aria-label="Facebook">
                            <i className="fa-brands fa-facebook"></i>
                        </a>
                        <a href="#" className="hover:text-velora-primary transition-colors" aria-label="X/Twitter">
                            <i className="fa-brands fa-x-twitter"></i>
                        </a>
                    </div>
                    <p className="text-sm mt-4 text-stone-300 font-sans">
                        <i className="fa-solid fa-phone mr-2"></i> +91 9988776655
                        <br />
                        <i className="fa-solid fa-envelope mr-2"></i> info@velorarooftop.com
                    </p>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-6 md:px-12 mt-10 pt-6 border-t border-stone-700/50 text-center text-xs text-stone-500 font-sans">
                &copy; {new Date().getFullYear()} Velora Rooftop. All Rights Reserved. | Designed with GSAP & React.
            </div>
        </footer>
    );
};


// --- Main App Component ---
const App = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEventPlannerOpen, setIsEventPlannerOpen] = useState(false);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prev => !prev);
    }, []);

    const toggleEventPlanner = useCallback(() => {
        setIsEventPlannerOpen(prev => !prev);
    }, []);

    const loadExternalResources = () => {
        const head = document.head;

        // Function to create and append <script> or <link> elements
        const appendElement = (tag, attributes) => {
            const element = document.createElement(tag);
            Object.keys(attributes).forEach(key => {
                element.setAttribute(key, attributes[key]);
            });
            head.appendChild(element);
            return element;
        };
        
        // 1. Load Tailwind Config (MUST be loaded before the main Tailwind script)
        const tailwindConfigScript = appendElement('script', { type: "text/tailwindcss" });
        tailwindConfigScript.textContent = `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'velora-primary': '#e7caa9',
                    'velora-dark': '#262626', // Dark text/background for contrast
                    'velora-bg': '#fcf8f3', // Very light off-white background
                  }
                },
              }
            }
        `;

        // 2. Load Tailwind CSS (via script)
        appendElement('script', { src: "https://cdn.tailwindcss.com" });

        // 3. Load Google Fonts (Gilda Display for Serif and Inter for Sans)
        appendElement('link', { 
            rel: "stylesheet", 
            href: "https://fonts.googleapis.com/css2?family=Gilda+Display&family=Inter:wght@100..900&display=swap" 
        });

        // 4. Load Font Awesome Icons
        appendElement('link', { 
            rel: "stylesheet", 
            href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        });

        // 5. Load GSAP and ScrollTrigger
        if (!window.gsap) {
            const gsapScript = appendElement('script', { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" });
            gsapScript.onload = () => {
                const scrollTriggerScript = appendElement('script', { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" });
                scrollTriggerScript.onload = () => {
                    if (window.gsap && window.ScrollTrigger) {
                        window.gsap.registerPlugin(window.ScrollTrigger);
                        console.log("GSAP and ScrollTrigger loaded and registered.");
                    }
                };
            };
        }

        // 6. Inject Custom Styles (using a <style> tag)
        const style = appendElement('style', {});
        style.textContent = `
            /* Custom font setup for Tailwind */
            html { scroll-behavior: smooth; }
            .font-serif { font-family: 'Gilda Display', serif; }
            .font-sans { font-family: 'Inter', sans-serif; }
            /* Ensure video covers viewport fully and adjust filter for light theme contrast */
            /* Removed brightness filter for a cleaner, high-contrast look */
            #hero video { filter: none; } 
            /* Set a default background color */
            body { background-color: #fcf8f3; }
        `;
    };


    useEffect(() => {
        loadExternalResources();
    }, []);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    
    return (
        <div className="bg-velora-bg min-h-screen font-sans">
            <Navbar toggleMenu={toggleMenu} />
            <HeroSection openMenu={toggleMenu} />
            <ExperienceSection openEventPlanner={toggleEventPlanner} />
            <GallerySection />
            <FooterSection />
            <MenuModal isOpen={isMenuOpen} onClose={toggleMenu} />
            <EventPlannerModal isOpen={isEventPlannerOpen} onClose={toggleEventPlanner} />
        </div>
    );
};

export default App;       
