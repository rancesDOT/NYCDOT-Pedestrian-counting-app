# NYCDOT Pedestrian Counting App

A React/Tailwind + TypeScript web app for tracking pedestrian counts. Built for NYCDOT by Rances Colon.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm
### Next.js Setup

If you need to set up Next.js:
Install Next.js and React dependencies:
```bash
npm install next react react-dom
```
## Project Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/rancescolon/NYCDOT-Pedestrian-counting-app.git
cd NYCDOT-Pedestrian-counting-app
```
### Run Local Development Server
```bash
npm install
npm run dev
```
Open your browser and go to [http://localhost:3000](http://localhost:3000) to view the app.


## Deployment

This project is live at using Github Pages:

**[https://rancescolon.github.io/NYCDOT-Pedestrian-counting-app/](https://vercel.com/rances-projects-ba594abf/v0-pedestrian-counting-app)**

# Contributing
1. Fork the repo
2. Create a feature branch 
3. Commit your changes
4. Open a pull request

# Project Structure
- app/ — Main app directory 
  - globals.css — Global styles 
  - layout.tsx — Root layout 
  - page.tsx — Main page (to add new pages create new folder with new page.tsx [source](https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts))
  - counter/page.tsx — Counter feature
