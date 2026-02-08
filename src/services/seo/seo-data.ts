import type { SEORoleBucket } from './types';

export const SEO_BUCKETS: SEORoleBucket[] = [
    {
        id: 'software-engineer',
        slug: 'software-engineer',
        title: 'Software Engineer',
        keywords: ['developer', 'programmer', 'coder', 'engineer', 'stack', 'backend', 'frontend', 'fullstack', 'web'],
        description: "Generate a tailored resume for Software Engineer roles. Optimized for ATS and highlighting key technical skills like React, Node, and Python.",
        content: {
            headline: "Build a Software Engineer Resume that Compiles",
            subheadline: "Stop guessing keywords. We analyze the job description and tailor your resume for every specific stack.",
            topSkills: ["System Design", "Algorithms", "React / Node.js", "CI/CD Pipelines", "Cloud Architecture (AWS/GCP)"],
            commonMistakes: [
                "Listing every language you've ever touched.",
                "Focusing on responsibilities instead of impact (e.g., 'Refactored API' vs 'Reduced latency by 40%').",
                "Ignoring the specific stack mentioned in the JD."
            ],
            proTip: "Quantify your engineering impact. Did you reduce build times? Increase uptime? Scale to X users? Numbers speak louder than code."
        }
    },
    {
        id: 'product-manager',
        slug: 'product-manager',
        title: 'Product Manager',
        keywords: ['product', 'manager', 'owner', 'roadmap', 'scrum', 'agile', 'feature'],
        description: "Create a data-driven Product Manager resume. Highlight your ability to lead cross-functional teams and ship successful products.",
        content: {
            headline: "Ship Your Product Manager Resume",
            subheadline: "Showcase your leadership. We help you articulate your product vision and execution strategy.",
            topSkills: ["Roadmap Strategy", "Agile / Scrum", "User Research", "Data Analysis (SQL/Tableau)", "Stakeholder Management"],
            commonMistakes: [
                "Using buzzwords without context.",
                "Failing to mention specific product outcomes (launch metrics, user growth).",
                "Focusing too much on technical details instead of business value."
            ],
            proTip: "Focus on the 'Why' and the 'So What'. Why did you build that feature? What was the business outcome?"
        }
    },
    {
        id: 'marketing-manager',
        slug: 'marketing-manager',
        title: 'Marketing Manager',
        keywords: ['marketing', 'brand', 'growth', 'social', 'content', 'campaign', 'seo', 'sem'],
        description: "Craft a Marketing Manager resume that converts. optimize for growth, branding, and campaign performance metrics.",
        content: {
            headline: "Market Yourself as a Top Manager",
            subheadline: "Highlight your campaign wins. We help you showcase your ROI and growth metrics.",
            topSkills: ["Campaign Strategy", "SEO / SEM", "Content Marketing", "Brand Management", "Analytics (GA4/HubSpot)"],
            commonMistakes: [
                "Listing generic duties like 'managed social media'.",
                "Forgetting to include campaign performance metrics (ROI, conversion rates).",
                "Not tailoring the resume to the specific marketing channel (e.g., B2B vs B2C)."
            ],
            proTip: "Use numbers to tell your story. 'Increased leads by 200%' is better than 'Managed lead generation'."
        }
    },
    {
        id: 'data-scientist',
        slug: 'data-scientist',
        title: 'Data Scientist',
        keywords: ['data', 'scientist', 'analyst', 'machine learning', 'ai', 'python', 'sql', 'model'],
        description: "Build a Data Scientist resume that interprets success. Highlight your modeling, analysis, and insight generation skills.",
        content: {
            headline: "Model Your Career as a Data Scientist",
            subheadline: "Turn your experience into insights. We help you highlight your technical and analytical prowess.",
            topSkills: ["Machine Learning", "Python / R", "SQL", "Data Visualization", "Statistical Modeling"],
            commonMistakes: [
                "Listing models without explaining their business impact.",
                "Overloading the resume with academic jargon.",
                "Ignoring the data cleaning and preparation process."
            ],
            proTip: "Balance the math with the business. How did your model improve decision-making or revenue?"
        }
    },
    {
        id: 'nurse',
        slug: 'nurse',
        title: 'Nurse',
        keywords: ['nurse', 'rn', 'lpn', 'clinical', 'patient', 'care', 'health', 'medical'],
        description: "Create a compassionate and professional Nursing resume. Highlight your clinical skills, patient care, and certifications.",
        content: {
            headline: "Care for Your Nursing Resume",
            subheadline: "Showcase your clinical expertise. We help you highlight your patient care and medical knowledge.",
            topSkills: ["Patient Care", "Clinical Procedures", "Emergency Response", "Medication Administration", "Team Collaboration"],
            commonMistakes: [
                "Listing every single rotation from school (if experienced).",
                "Failing to mention specific certifications (BLS, ACLS).",
                "Not quantifying patient load or unit specifics."
            ],
            proTip: "Emphasize your versatility and ability to handle high-pressure situations with compassion."
        }
    },
    {
        id: 'general',
        slug: 'general',
        title: 'Professional',
        keywords: [],
        description: "Create a tailored resume for any role. Our AI analyzes the job description to highlight your most relevant skills and experience.",
        content: {
            headline: "Tailor Your Resume for Any Role",
            subheadline: "Don't let the ATS filter you out. We optimize your resume for the specific keywords in any job description.",
            topSkills: ["Communication", "Problem Solving", "Adaptability", "Time Management", "Collaboration"],
            commonMistakes: [
                "Using a generic resume for every application.",
                "Including irrelevant hobbies or outdated experience.",
                "Typos and formatting errors."
            ],
            proTip: "Always tailor your resume to the job description. Use the exact keywords they use."
        }
    }
];
