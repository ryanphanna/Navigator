# JobFit

A minimalist, AI-powered tool to analyze job compatibility, suggest resume tailoring, and generate cover letters using Google Gemini.

## 🚀 Features

*   **Job Analysis**: Paste a job description or URL (manual text fallback) to get a compatibility score (0-100%).
*   **Resume "Blocks" System**: Manage your experience as discrete blocks (work, projects, skills).
*   **Tailoring Suggestions**: AI recommends exactly which blocks to include/exclude for a specific job.
*   **Gap Analysis**: Identifies strengths and missing skills based on the job requirements.
*   **Cover Letter Generator**: Auto-generates professional cover letters, weaving in your specific experience.
*   **Contextual Notes**: Add job-specific context (e.g., "I'm currently learning X") that gets included in the cover letter.
*   **Local Storage**: All data stays in your browser's `localStorage`. No database required.

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, Lucide React (Icons)
*   **AI**: Google Gemini API (`gemini-3-flash-preview` for analysis, `gemini-flash-latest` for parsing)
*   **Persistence**: LocalStorage

## 🚦 Getting Started

### Prerequisites

*   Node.js (v18+)
*   A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ryanphanna/JobFit.git
    cd JobFit
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    *   Create a `.env` file in the root directory.
    *   Add your API key:
        ```bash
        VITE_API_KEY=your_gemini_api_key_here
        ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📦 Deployment

This project is optimized for deployment on **Vercel** or **Netlify**.

### Vercel (Recommended)

1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  Add the `VITE_API_KEY` environment variable in the Vercel dashboard.
4.  Deploy.

For more details, see [DEPLOYMENT.md](file:///Users/ryan/.gemini/antigravity/brain/5a71455a-f084-4ab2-af33-99ccdf623932/deployment.md).

## 🔒 Privacy & Data

JobFit is a **client-side only** application. Here's how your data is handled:

### Data Storage
- All data (resumes, job analyses, cover letters) is stored **locally in your browser's localStorage**
- Data is stored unencrypted - anyone with access to your browser can view it
- No user accounts or server-side storage - your data never leaves your device except when sent to AI services
- You can clear all data anytime via **Settings > Reset & Log Out**

### External Services
When you use JobFit, data is sent to these third-party services:

| Service | What's Sent | Purpose |
|---------|-------------|---------|
| **Google Gemini API** | Resume content, job descriptions, cover letters | AI analysis and generation |
| **api.allorigins.win** | Job posting URLs (not your personal data) | CORS proxy for scraping job sites |

### Recommendations
- Review [Google's Gemini API Terms of Service](https://ai.google.dev/terms) for their data handling policies
- Avoid including highly sensitive personal information (SSN, financial details) in your resume
- Clear your data after completing your job search if using a shared computer
- Your API key is stored in localStorage - treat it as you would any credential

### No Tracking
- No analytics, tracking pixels, or user monitoring
- No data is collected or stored by the application developers

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
