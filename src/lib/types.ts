export type UserRole = 'client' | 'worker' | 'both'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  skills: string[] | null
  verified?: boolean
  is_admin?: boolean
  created_at: string
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'payment'
  | 'review'
  | 'system'

export interface AppNotification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  video_id: string | null
  text: string | null
  read: boolean
  created_at: string
  actor?: Profile
}

export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Profile
}

export interface PortfolioItem {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  link: string | null
  created_at: string
}

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'telenor' | 'bank' | 'other'
export type PaymentStatus = 'submitted' | 'held' | 'released' | 'rejected'

export interface Payment {
  id: string
  client_id: string
  worker_id: string
  skill_post_id: string | null
  amount: number
  method: PaymentMethod
  screenshot_url: string | null
  note: string | null
  status: PaymentStatus
  created_at: string
  updated_at: string
  client?: Profile
  worker?: Profile
}

export interface Sound {
  id: string
  title: string
  artist: string | null
  audio_url: string | null
  cover_url: string | null
  duration: number | null
  source_video_id: string | null
  created_by: string | null
  uses_count: number
  created_at: string
}

export interface Video {
  id: string
  user_id: string
  video_url: string
  thumbnail_url: string | null
  caption: string | null
  music?: string | null
  link?: string | null
  location?: string | null
  visibility?: 'public' | 'followers'
  allow_comments?: boolean
  created_at: string
  // joined / computed fields
  profile?: Profile
  likes_count?: number
  comments_count?: number
  liked_by_me?: boolean
}

export interface Comment {
  id: string
  video_id: string
  user_id: string
  text: string
  created_at: string
  profile?: Profile
}

export interface SkillPost {
  id: string
  user_id: string
  title: string
  description: string
  category: string | null
  budget: number | null
  post_type: 'offer' | 'request'
  created_at: string
  profile?: Profile
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export interface Conversation {
  other_user: Profile
  last_message: Message
  unread: number
}
