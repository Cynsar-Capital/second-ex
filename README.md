# 2nd.exchange

This is a platform for building and sharing professional profiles with custom sections, recommendations, and more. The application uses Next.js for the frontend and Supabase for authentication, database, and storage.

## Features

- Username-based subdomain profiles (e.g., username.2nd.exchange)
- Customizable profile sections with templates (Work Experience, Education, Projects, etc.)
- Profile recommendations system
- Responsive design with dark mode support

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Initialize Supabase storage: `npm run storage`

## Supabase Setup

This project uses Supabase for authentication, database, and storage. You'll need to set up the following:

1. Create a Supabase project
2. Set up the database schema (migrations are included)
3. Configure storage buckets for profile images
4. Set up Row Level Security (RLS) policies

## GitHub Actions for Supabase Deployment

A GitHub Actions workflow is included to automate Supabase migrations and deployments. To set it up:

1. Add the following secrets to your GitHub repository:
   - `SUPABASE_ACCESS_TOKEN`: Generate from Supabase dashboard (Account > Access Tokens)
   - `SUPABASE_DB_PASSWORD`: Your Supabase database password
   - `SUPABASE_PROJECT_ID`: Your Supabase project ID (found in project settings)

2. Push to the main branch to trigger the workflow, or run it manually from the Actions tab

3. The workflow will:
   - Link to your Supabase project
   - Push database migrations
   - Set up storage buckets
   - Deploy Supabase functions

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
