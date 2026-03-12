# **App Name**: VigiTrack Central

## Core Features:

- Secure User Authentication: Allow users (general administrators and school-specific administrators) to log in via JWT tokens, managing user sessions securely.
- Multi-School Dashboard: Display an overview of all 7 connected schools as interactive cards or a list, indicating their status and allowing selection.
- Live Camera Feed Display: Upon school selection, render a responsive grid showing live video feeds from all its cameras, utilizing web-friendly formats for playback (e.g., HLS, converted RTSP).
- School Selector & Navigation: Provide a clear and efficient mechanism for users to easily alternate between different school views and their respective camera sets.
- Backend API Integration: Connect securely to the central REST API to fetch all necessary data, including school lists, camera configurations, and stream URLs, handling loading and error states gracefully.
- Operational Status Summary (AI): A generative AI tool provides concise natural language summaries of a school's overall surveillance operational status, synthesizing data from camera connectivity and activity logs.

## Style Guidelines:

- Background color: A dark, muted indigo-grey (#15171A) providing a professional, low-light 'surveillance mode' aesthetic suitable for prolonged viewing.
- Primary color: A vibrant, clear blue (#4689D1) used for active states, primary actions, and key textual highlights, signifying operational clarity and technology.
- Accent color: A bright, distinct cyan (#48D1DB) to draw attention to critical alerts, status changes, and important notifications, ensuring high visibility.
- Font: 'Inter' (sans-serif) for all textual content, offering excellent readability, a modern feel, and objective neutrality for a technical dashboard.
- Utilize minimalist, geometric line icons to convey information clearly and concisely, aligning with a sleek and modern professional aesthetic.
- Responsive grid-based layouts ensure optimal display of school overviews and camera feeds across diverse screen sizes, prioritizing clear content hierarchy and accessibility.
- Implement subtle, swift transitions and feedback animations for interactions like school selection and data loading, enhancing user experience without visual distraction.