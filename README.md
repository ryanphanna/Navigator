# Navigator

A minimalist, AI-powered tool to analyze job compatibility, suggest resume tailoring, and generate cover letters using Google Gemini.

Navigator helps you manage your professional experience as discrete "blocks" and intelligently suggests how to tailor them for any specific job description.

## 🚀 Key Features

### 🔍 Job Analysis
- **Compatibility Scoring**: Get an instant 0-100% fit score based on your resume and the job description.
- **Gap Analysis**: Identifies exactly which strengths you have and which skills you're missing.
- **URL Scraping**: Direct parsing of job postings from URLs (powered by Supabase Edge Functions).

### 🧱 Resume Blocks
- **Modular Experience**: Manage your work history, projects, and skills as discrete, reusable blocks.
- **Smart Tailoring**: AI recommends which specific blocks to include or exclude to maximize your fit for a role.
- **Contextual Tuning**: Add job-specific context (e.g., "I'm currently learning X") to influence the AI's suggestions.

### 📝 Content Generation
- **Cover Letter Engine**: Auto-generates professional, tailored cover letters that weave in your specific experiences.
- **Resume Refinement**: AI suggestions on how to tweak your bullet points for specific keywords.

### 🌓 Modern Experience
- **Privacy First**: Choose between Local Storage (BYOK) or managed storage. All sensitive data is encrypted.
- **Theme Support**: Seamless switching between Light and Dark modes.
- **No Tracking**: No analytics, tracking pixels, or user monitoring. Your data is yours.

---

## 🛠️ Getting Started

1. **Sign In**: Join via the invite-only portal (requires a valid invite code).
2. **Setup**: Add your Gemini API Key in Settings (stored securely via AES-GCM encryption).
3. **Build**: Create your resume blocks (Work, Projects, Skills).
4. **Analyze**: Paste a job URL or description and get tailored results!

---

## 📄 Documentation & Links

- **[SECURITY.md](./SECURITY.md)** - Security model, encryption, and RBAC details.
- **[CHANGELOG.md](./CHANGELOG.md)** - Recent improvements and technical history.
- **[supabase_schema.sql](./supabase_schema.sql)** - Database schema and RLS policies.

---

**Happy Hunting! 🚀💼**
