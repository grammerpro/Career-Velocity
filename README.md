<div align="center">

# 🚀 Career Velocity

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)

**A full-stack AI-powered job search platform — track applications, get AI resume feedback, prepare for interviews, and match with jobs, all in one dashboard.**

[🐛 Report Bug](https://github.com/grammerpro/Career-Velocity/issues) · [💡 Request Feature](https://github.com/grammerpro/Career-Velocity/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- - [Features](#-features)
  - - [Tech Stack](#-tech-stack)
    - - [Getting Started](#-getting-started)
      - - [Project Structure](#-project-structure)
        - - [Environment Variables](#-environment-variables)
          - - [Roadmap](#-roadmap)
            - - [Contributing](#-contributing)
              - - [License](#-license)
               
                - ---

                ## 🔍 About

                Career Velocity is a production-grade SaaS application designed to streamline the modern job search. It combines an intuitive application tracker, AI-powered resume analysis, smart job matching, an interview prep module, and a digital store — all under one authenticated dashboard.

                ---

                ## ✨ Features

                - 📋 **Application Tracker** — Manage job applications with status, notes, and timeline
                - - 🤖 **AI Resume Analyzer** — Upload your resume; get actionable feedback powered by OpenAI GPT
                  - - 🎯 **Job Matcher** — Smart matching to relevant roles based on your resume profile
                    - - 🎤 **Interview Prep** — Practice common interview questions with AI-generated follow-ups
                      - - 🛒 **Digital Store** — Purchase premium templates and resources via Stripe Checkout
                        - - 🔒 **Authentication** — Secure sign-in with NextAuth.js (credentials + OAuth)
                          - - ☁️ **Cloud Storage** — Resume uploads handled via AWS S3 with presigned URLs
                            - - 📧 **Email Notifications** — Transactional emails via Nodemailer
                             
                              - ---

                              ## 🛠️ Tech Stack

                              | Layer | Technology |
                              |-------|-----------|
                              | Framework | Next.js 16 (App Router) |
                              | Language | TypeScript |
                              | Styling | Tailwind CSS v4 |
                              | Animations | Framer Motion |
                              | Icons | Lucide React |
                              | ORM | Prisma 7 |
                              | Database | PostgreSQL |
                              | Auth | NextAuth.js v4 |
                              | AI | OpenAI API (GPT) |
                              | Payments | Stripe |
                              | Storage | AWS S3 |
                              | PDF Parsing | pdf-parse · @react-pdf/renderer |
                              | Drag & Drop | @dnd-kit |
                              | Email | Nodemailer |

                              ---

                              ## 🚀 Getting Started

                              ### Prerequisites

                              - **Node.js** v18+
                              - - **PostgreSQL** database (local or hosted)
                                - - **OpenAI** API key
                                  - - **Stripe** account (test keys for dev)
                                    - - **AWS S3** bucket + credentials
                                     
                                      - ### Installation
                                     
                                      - ```bash
                                        git clone https://github.com/grammerpro/Career-Velocity.git
                                        cd Career-Velocity
                                        npm install
                                        ```

                                        Copy the environment template and fill in your values:

                                        ```bash
                                        cp .env.example .env.local
                                        ```

                                        Set up the database:

                                        ```bash
                                        npx prisma migrate dev
                                        npx prisma generate
                                        ```

                                        Start the development server:

                                        ```bash
                                        npm run dev
                                        ```

                                        Open [http://localhost:3000](http://localhost:3000).

                                        ---

                                        ## 📁 Project Structure

                                        ```
                                        Career-Velocity/
                                        ├── src/
                                        │   ├── app/
                                        │   │   ├── dashboard/
                                        │   │   │   ├── applications/   # Job application tracker
                                        │   │   │   ├── resumes/        # Resume upload & AI analysis
                                        │   │   │   ├── matcher/        # Job matching engine
                                        │   │   │   ├── interview-prep/ # AI interview practice
                                        │   │   │   └── store/          # Digital store (Stripe)
                                        │   │   ├── auth/signin/        # Authentication pages
                                        │   │   └── api/                # API routes
                                        │   ├── components/             # Shared UI components
                                        │   ├── actions/                # Next.js server actions
                                        │   ├── lib/                    # Prisma client, utils, helpers
                                        │   └── types/                  # TypeScript type definitions
                                        ├── prisma/
                                        │   └── schema.prisma           # Database schema
                                        ├── browser-extension/          # Companion browser extension
                                        └── package.json
                                        ```

                                        ---

                                        ## 🔑 Environment Variables

                                        <details>
                                          <summary><strong>View required environment variables</strong>strong></summary>summary>
                                        
                                        ```env
                                        # Database
                                        DATABASE_URL=postgresql://user:password@localhost:5432/career_velocity

                                        # Authentication
                                        NEXTAUTH_SECRET=your-secret-here
                                        NEXTAUTH_URL=http://localhost:3000

                                        # OpenAI
                                        OPENAI_API_KEY=sk-...

                                        # Stripe
                                        STRIPE_SECRET_KEY=sk_test_...
                                        STRIPE_WEBHOOK_SECRET=whsec_...
                                        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

                                        # AWS S3
                                        AWS_ACCESS_KEY_ID=...
                                        AWS_SECRET_ACCESS_KEY=...
                                        AWS_REGION=us-east-1
                                        AWS_S3_BUCKET_NAME=career-velocity-resumes

                                        # Email
                                        EMAIL_HOST=smtp.gmail.com
                                        EMAIL_USER=your@email.com
                                        EMAIL_PASSWORD=your-app-password
                                        ```
                                        </details>
                                        
                                        ---

                                        ## 🗺️ Roadmap

                                        - [ ] Job board integration (LinkedIn / Indeed API)
                                        - [ ] - [ ] Chrome extension for one-click application saving
                                        - [ ] - [ ] Analytics dashboard (applications sent vs interviews vs offers)
                                        - [ ] - [ ] Cover letter AI generator
                                        - [ ] - [ ] Mobile app (React Native)
                                        - [ ]
                                        - [ ] ---
                                        - [ ]
                                        - [ ] ## 🤝 Contributing
                                        - [ ]
                                        - [ ] 1. Fork the repository
                                        - [ ] 2. Create a branch: `git checkout -b feature/your-idea`
                                        - [ ] 3. Commit: `git commit -m 'feat: describe your change'`
                                        - [ ] 4. Push and open a Pull Request
                                        - [ ]
                                        - [ ] ---
                                        - [ ]
                                        - [ ] ## 📄 License & Contact
                                        - [ ]
                                        - [ ] Released under the **MIT License**.
                                        - [ ]
                                        - [ ] **Vardhan** · [vardhana1209@gmail.com](mailto:vardhana1209@gmail.com) · [github.com/grammerpro](https://github.com/grammerpro)</summary>
                                        </details>
