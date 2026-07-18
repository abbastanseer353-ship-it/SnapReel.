export type UserRole = 'client' | 'worker' | 'both'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  skills: string[] | null
  created_at: string
}

export interface Video {
  id: string
  user_id: string
  video_url: string
  thumbnail_url: string | null
  caption: string | null
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
