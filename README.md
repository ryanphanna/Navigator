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

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
