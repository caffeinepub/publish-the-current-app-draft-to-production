# Ocarina Learning & Community Platform

## Overview
A comprehensive platform for learning ocarina, sharing musical content, and purchasing ocarina-related products. The application combines educational content, community features, e-commerce functionality, and an integrated token economy supporting local tokens and Stripe payments.

## Authentication
- Users authenticate using Internet Identity
- User profiles store personal information, uploaded content, purchase history, and local token balance
- Profile creation automatically initializes users in the access control system with appropriate roles (#user or #admin if first user)
- Backend ensures seamless profile creation without authorization errors by automatically handling access control initialization

## Profile Setup Modal
- Profile setup modal properly handles asynchronous profile creation/updates with complete UserProfile object construction
- Frontend automatically includes all required default values when creating profiles: uploadedContent as empty array, purchasedContent as empty array, createdAt timestamp, role as user, tokenBalance as 0, and transactionHistory as empty array
- When users provide only username and bio, frontend constructs complete UserProfile with all required fields and default values
- Modal waits for backend response from saveCallerUserProfile or updateProfile operations
- Successful profile creation automatically closes the modal
- Failed profile operations display clear, detailed error messages from backend responses to users
- Frontend error handling properly extracts and shows backend error messages without generic fallbacks
- Modal close button (X) properly sets modal state to false and allows users to exit
- Loading indicator prevents multiple submission attempts during profile processing
- Users can exit the modal at any time using the close button
- Backend validates complete UserProfile objects and prevents "variant has no object" runtime errors

## Token System
- Single currency system: local in-app tokens managed by Motoko token module
- Local tokens support minting, transfers, and balance tracking
- Admins can mint new local tokens and distribute them to users
- Users can transfer local tokens to each other
- Automatic local token rewards system for tutorial completions, song lesson achievements, community post creation, and purchase completion
- Backend handles token operations: minting, transfers, balance management, spending operations, and reward distribution
- Token balances and transaction history tracked per user

## Automatic Reward System
- Community post creation automatically awards users 10 local tokens using existing Token.recordEarning logic
- Purchase completion (Stripe payments) automatically rewards users with bonus local tokens equal to 5% of purchase total
- Backend triggers reward transactions during post creation and order completion processes
- Reward calculations convert purchase amounts to appropriate token quantities
- All reward transactions are recorded in user transaction history
- Frontend displays success notifications confirming token rewards: "You've earned tokens for sharing your recording!" and "You've earned bonus tokens for your purchase!"
- Wallet interface automatically updates to reflect new token balances after rewards
- Existing token minting and spending logic remains unchanged and compatible with reward flow

## Learning Section
- Tutorial library with video lessons organized by difficulty levels (beginner, intermediate, advanced)
- Each tutorial contains title, description, difficulty level, and embedded video player
- Users can upload their own tutorials with video files and metadata
- Tutorials can be purchased using Stripe payments or local tokens
- Free tutorials available without authentication or purchase requirements
- Automatic local token rewards granted upon tutorial completion
- Progress tracking system to determine reward eligibility
- Backend stores tutorial metadata, video references, user associations, pricing information, completion status, and reward history
- Tutorial video playback functionality with proper media file loading from storage
- Tutorial selection opens modal or playback section with reliable video loading
- Error handling displays messages when video files fail to load
- Tutorial modals can be opened, viewed, and closed without breaking navigation
- Backend provides proper video file URLs and metadata for frontend video playback
- Admin users can create new tutorial entries with title, description, difficulty level, video file association, and creator assignment
- Tutorial creation functionality allows linking uploaded video files to new tutorial entries
- Backend supports tutorial creation with all required metadata fields and proper video file associations
- Video file replacement functionality to update corrupted media files with valid playable versions

## Bulk Tutorial Deletion
- Admin-only `clearTutorials` function for complete tutorial database cleanup
- Backend removes all tutorial entries, associated metadata, and access records
- Frontend automatically refreshes learning section UI after bulk deletion
- Access control ensures only admin users can trigger bulk tutorial deletion
- Learning section displays empty state when no tutorials are present
- Complete cleanup includes tutorial metadata, video references, completion tracking, and reward history

## AI Learning Assistant
- AI assistant panel integrated into the tutorial playback interface
- Assistant provides real-time feedback and guidance during video lessons
- Context-aware suggestions based on tutorial progress and video segments
- Backend generates AI responses based on tutorial content and user progress
- Users can enable or disable the AI assistant during playback sessions
- Assistant panel displays tips, corrective suggestions, and learning guidance
- AI feedback adapts to different difficulty levels and tutorial topics
- Backend stores AI assistant preferences and interaction history per user
- Assistant responses are contextual to specific video timestamps and lesson content

## AI Chat Tutor
- Global floating chat window accessible from bottom-right corner of all pages
- Real-time conversational AI tutor for ocarina learning questions, performance tips, and practice feedback
- Chat window can be toggled open/closed and maintains visibility state across page navigation
- Message history persists during user session and displays previous conversations
- Backend integrates with existing `provideAIResponse` function using contextual tutorialId, timestamp, and user query
- Chat interface styled to match application theme with ocarina-themed visual elements
- Users can ask questions about ocarina techniques, song practice, learning progression, and general music theory
- AI responses are contextual and educational, focusing on ocarina learning and musical guidance
- Chat component accessible to both authenticated and non-authenticated users
- Backend stores chat conversation history per user session
- Chat messages support text-based communication with the AI tutor
- Floating chat button displays notification indicator when new AI responses are available
- Chat window includes typing indicators and message status feedback
- Responsive chat interface adapts to different screen sizes while maintaining bottom-right positioning

## Community Section
- Users can upload and share audio/video recordings
- Posts support external links and user-generated content
- Like and comment system for all shared content
- Premium content access available through local token payments
- User profile pages displaying shared songs, downloaded content, and token balance
- Backend stores posts, media files, comments, likes, user interactions, and transactions
- Share Recording functionality with upload dialog for video or audio files
- Recording upload process: file selection, title and description entry, media file upload via uploadMediaFile, and community post creation via addPost
- Immediate page refresh after successful recording upload to display new content in community feed
- Success and error feedback messages (toast notifications or modals) for recording upload operations
- Clear user feedback on posting success or failure during the sharing process
- Automatic token reward system triggers when users successfully create community posts
- Post creation success notifications include token reward confirmation messages

## Store Section
- Product catalog for ocarinas, accessories, and digital sheet music
- Product pages with images, descriptions, pricing, and inventory levels
- Shopping cart functionality with item management
- Dual payment system: Stripe integration and local token payments
- Digital download delivery for sheet music purchases
- Backend manages product inventory, orders, payment processing for both payment methods
- Purchase completion automatically triggers bonus token rewards proportional to purchase total
- Order success notifications include bonus token reward confirmation messages

## Product Creation with Image Upload
- AddProductDialog component supports multiple image uploads during product creation
- Users can upload multiple images using the existing uploadMediaFile function
- Image preview functionality displays uploaded images before product submission
- Backend stores product images in the product's images field as an array of image references
- Both admin and regular users can create products with image uploads
- Role-based permissions maintained for product creation functionality
- Store display shows product images in product listings and detail views
- Product deletion functionality handles removal of associated images
- Image upload process integrated into the product creation workflow
- Frontend validates image uploads and provides feedback during the upload process

## Stripe Checkout Configuration
- Backend validates Stripe configuration before creating checkout sessions
- Stripe secret key and allowed countries must be properly configured
- Backend returns clear error messages when Stripe configuration is missing or invalid
- createCheckoutSession endpoint validates configuration before proceeding with session creation
- Configuration validation prevents checkout attempts with incomplete Stripe setup

## Homepage
- Featured tutorials from the learning section
- Recent community posts and popular content
- Highlighted store products and promotions
- User balance display for local tokens
- Navigation to all main sections

## Navigation Header
- Main navigation header includes shopping cart icon shortcut positioned next to the profile icon
- Shopping cart icon only appears for logged-in users
- Cart icon displays a badge showing the current number of items in the cart
- Clicking the cart icon instantly opens the existing CartDrawer component
- Cart icon uses appropriate cart vector icon for clarity

## Admin Panel
- Content management for tutorials, products, and community posts
- User management and moderation tools
- Local token minting and distribution controls
- Inventory and order management
- Analytics and reporting features including token economy metrics
- Reward system configuration and monitoring
- Media library management with video upload functionality
- Tutorial creation interface for linking uploaded videos to new tutorial entries
- Media file replacement functionality for updating corrupted or non-functional video files
- Bulk tutorial deletion functionality with `clearTutorials` admin-only access

## Deletion Functionality
- Comprehensive deletion system for items, videos, and community posts across the application
- Backend implements secure deletion endpoints with role-based access control
- Admins can delete any item, video, or community post throughout the platform
- Users can delete only their own uploaded media and posts
- Automatic cleanup of related references when content is deleted (e.g., tutorials using deleted media files)
- Frontend provides visible delete buttons with confirmation dialogs in all relevant sections
- Media Library (AdminPage tab) includes delete functionality for videos and media files
- StorePage provides product deletion capabilities for admin users only
- CommunityPage allows post deletion for post authors and admin users
- UI lists automatically refresh after successful deletion operations
- Success and error toast notifications for all deletion actions
- Strict role-based access control using existing AccessControl logic for secure operations
- Backend validates user permissions before processing any deletion requests
- Safe deletion process ensures data integrity and prevents orphaned references
- Bulk tutorial deletion with complete database cleanup and UI refresh
- Product deletion includes cleanup of associated product images

## Data Storage (Backend)
- User profiles and authentication data with automatic access control initialization
- Complete UserProfile object validation with all required fields: username, bio, uploadedContent, purchasedContent, createdAt, role, tokenBalance, transactionHistory
- Tutorial metadata, video references, and completion tracking
- Video file storage and retrieval with proper URL generation for frontend playback
- Community posts, comments, and interactions
- Product catalog with inventory tracking and image storage
- Product images stored as arrays of image references in product records
- Order history and payment records for Stripe and token payments
- Local token balances and transaction history
- Reward distribution records and achievement tracking including community post and purchase rewards
- Admin settings and configurations
- Stripe configuration settings with validation
- AI assistant preferences and interaction history per user
- AI response generation based on tutorial content and user progress
- AI chat conversation history and session management
- Chat message storage with timestamps and user context
- Media library with uploaded video files and metadata
- Tutorial creation data with video file associations and creator information
- Tutorial pricing information including free tutorial designations
- Media file replacement and update functionality for maintaining video library integrity
- Deletion tracking and reference cleanup for removed content
- Secure deletion endpoints with proper authorization validation
- Bulk tutorial deletion functionality with complete cleanup of all tutorial-related data
- Automatic reward transaction processing for community posts and purchases
- Product image management with upload, storage, and deletion capabilities

## Key Features
- Video playback for tutorials and community content with reliable loading and error handling
- File upload system for user-generated content including product images
- Multiple image upload functionality for product creation
- Image preview system for product creation workflow
- Dual payment processing with Stripe and local tokens
- Robust Stripe checkout flow with proper configuration validation and error handling
- Digital content delivery system
- Wallet functionality with balance display and transfer capabilities for local tokens
- Automatic reward system for learning achievements, community participation, and purchases
- Progress tracking and token earning notifications
- Search and filtering across all sections
- Responsive design with modern UI components
- Comprehensive token economy with local tokens
- Seamless user onboarding with automatic access control setup
- Robust profile setup modal with proper error handling, loading states, and complete UserProfile object construction
- Reliable profile creation without runtime errors through proper data validation
- AI-powered learning assistance with contextual feedback and guidance
- Global AI chat tutor with floating window interface and conversation history
- Real-time AI tutoring accessible from any page with ocarina-themed styling
- Media library management with video upload and tutorial creation capabilities
- Free tutorial access without authentication requirements
- Media file replacement and update capabilities for maintaining video functionality
- Comprehensive deletion system with role-based access control and automatic reference cleanup
- Toast notifications for user feedback on all operations including deletions and reward confirmations
- Confirmation dialogs for destructive actions to prevent accidental deletions
- Bulk tutorial deletion with admin-only access and automatic UI refresh
- Automatic token reward notifications for community posts and purchases
- Product image display in store listings and product detail views
- Shopping cart icon shortcut in navigation header with item count badge and instant cart drawer access

## Frontend Token Features
- Wallet view displaying current local token balance
- Transaction history showing earnings and spending for local tokens
- Send tokens dialog for peer-to-peer local token transfers
- In-app checkout options supporting Stripe and local token payments
- Balance indicators for local tokens in user interface
- Learning progress indicators with token reward notifications
- Achievement badges and reward history display
- Admin token minting and distribution interface for local tokens
- Automatic wallet balance updates after reward transactions
- Success notifications for community post and purchase reward earnings

## Frontend Checkout Error Handling
- Cart checkout displays helpful messages when Stripe configuration is missing or invalid
- User-friendly error messages for general users: "Checkout temporarily unavailable"
- Detailed error messages displayed to admin users only for troubleshooting
- Frontend properly calls backend createCheckoutSession when configuration is valid
- Error handling differentiates between configuration issues and other checkout problems
- Clear messaging guides users when payment options are unavailable

## Content Removal Requirements
- Backend removes all media entries with "Bunny" in the name or title from media library and blob storage
- Backend removes all tutorial entries that reference Bunny-related content
- Frontend removes Bunny tutorial references from homepage featured sections and learning page content
- Media library and learning section properly refresh and display updated content without Bunny-related entries
- All application content is displayed in English language
