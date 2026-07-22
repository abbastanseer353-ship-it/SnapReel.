import { getAiResponse } from './geminiHelper'

export interface AssistantTopic {
  id: string
  keywords: string[]
  answer: string
}

/**
 * Built-in guide assistant knowledge base. It answers user questions about
 * what the app does and where each feature lives. Works fully offline (no
 * external API needed). Matching is keyword/intent based and supports English,
 * Urdu and roman-urdu phrasing.
 * 
 * NOTE: This is kept for fallback/reference. Main AI responses now use Google Gemini API.
 */
export const topics: AssistantTopic[] = [
  {
    id: 'overview',
    keywords: [
      'app', 'about', 'overview', 'features', 'kya kya', 'hunar',
      'introduction', 'intro', 'batao app', 'app kya', 'app ke bare',
    ],
    answer:
      'Hunar ek TikTok-jaisi video app hai jis mein ek "Earning" marketplace bhi hai. Aap videos bana/upload kar sakte hain, like/comment/follow kar sakte hain, aur "Earning" section mein client/worker ban sakte hain.',
  },
  {
    id: 'feed',
    keywords: [
      'feed', 'home', 'watch', 'video dekh', 'scroll', 'reels', 'main page',
      'homepage', 'ghar', 'videos dekhna',
    ],
    answer:
      'Home tab (🏠) aapki video feed hai — TikTok jaisa upar-neeche scroll. Video par tap kar ke play/pause hota hai. Right side par ❤️ like, 💬 comment aur ✉️ chat ke buttons hain.',
  },
  {
    id: 'create',
    keywords: [
      'banao', 'banau', 'banani', 'record', 'shoot', 'camera', 'create',
      'upload video', 'plus', 'video banana', 'studio', 'creator', 'nayi video',
      'record page',
    ],
    answer:
      'Neeche beech wala + button dabao to Creator Studio khulta hai. Wahan camera se record karo ya gallery se video import karo, left/right swipe kar ke filters lagao, aur music choose karo.',
  },
  {
    id: 'filters',
    keywords: [
      'filter', 'filters', 'effect', 'snapchat', 'left right', 'swipe', 'rang',
      'color', 'black white', 'vintage', 'b&w',
    ],
    answer:
      'Record aur Edit dono par filters hain (Normal, Vivid, Warm, Cool, Vintage, B&W, Noir, Fade, Dramatic, Dreamy, Invert). Snapchat jaisa left/right swipe ya neeche chips par tap kar ke filter lagao.',
  },
  {
    id: 'music',
    keywords: ['music', 'song', 'sound', 'gaana', 'track', 'audio', 'awaz'],
    answer:
      'Record aur Edit par music ka option hai — bundled royalty-free tracks (Chill, Energetic, Lofi). Record karte waqt music bajta hai taake aap uske hisaab se acting kar sakein.',
  },
  {
    id: 'edit',
    keywords: [
      'edit', 'editing', 'trim', 'cut', 'capcut', 'speed', 'text', 'overlay',
      'volume', 'cover', 'thumbnail', 'kaat', 'editor',
    ],
    answer:
      'Edit page (CapCut-inspired) par: trim (start/end kaato), speed (0.5x–2x), volume/mute, filter, aur draggable text overlays (rang aur size ke saath) laga sakte ho.',
  },
  {
    id: 'post',
    keywords: [
      'caption', 'post', 'hashtag', 'mention', 'link', 'location', 'publish',
      'next', 'privacy', 'visibility', 'comments off', 'description',
    ],
    answer:
      'Edit ke baad Post page: caption likho (#hashtag aur @mention khud chips ban jate hain), link aur location lagao, visibility (Public/Followers) chuno, aur comments on/off karo.',
  },
  {
    id: 'drafts',
    keywords: ['draft', 'drafts', 'save karo', 'baad mein', 'unfinished', 'gallery'],
    answer:
      'Drafts aapke phone (browser) mein IndexedDB par save hote hain — internet ke bina bhi. Creator Studio ke Drafts section se koi bhi draft resume ya delete kar sakte ho.',
  },
  {
    id: 'earning',
    keywords: [
      'earning', 'kamai', 'paisa', 'money', 'client', 'worker', 'skill',
      'skills', 'job', 'kaam dhundo', 'hire', 'marketplace', 'offer', 'request',
      'budget', 'gig',
    ],
    answer:
      'Earning tab (💼) ek skill marketplace hai. Log do tarah ke posts lagate hain: "Offer" (main ye skill deta hoon) aur "Request" (mujhe ye kaam karwana hai).',
  },
  {
    id: 'chat',
    keywords: [
      'chat', 'message', 'messages', 'inbox', 'baat', 'dm', 'talk', 'real time',
      'reply', 'text message', 'conversation',
    ],
    answer:
      'Inbox tab (💬) aapki saari chats dikhata hai. Kisi ki profile ya video se "Message" dabao to 1-to-1 chat khulti hai. Messages real-time Supabase se aati hain.',
  },
  {
    id: 'profile',
    keywords: [
      'profile', 'me', 'account', 'edit profile', 'bio', 'avatar', 'role',
      'followers', 'following', 'meri profile',
    ],
    answer:
      'Me tab (👤) aapki profile hai: avatar, naam, role (Client/Worker/Both), bio, skills, aur video grid. "Edit profile" se sab kuch badlo.',
  },
  {
    id: 'settings',
    keywords: ['settings', 'setting', 'gear', 'help', 'guide', 'info', 'maloomat', 'about app'],
    answer:
      'Settings profile ke upar-right ⚙️ button se khulti hai. Wahan app ka poora guide, account options (log out), aur app ke bare mein maloomat milti hai.',
  },
  {
    id: 'offline',
    keywords: [
      'offline', 'internet', 'net nahi', 'without internet', 'save offline',
      'download video', 'dobara dekho', 'no internet', 'cache',
    ],
    answer:
      'Jo videos aap dekhte hain woh khud-ba-khud "Offline" mein save ho jati hain. Internet na ho tab bhi Profile ke "Offline" tab se woh videos dobara dekh sakte hain.',
  },
  {
    id: 'likes',
    keywords: ['like', 'comment', 'follow', 'unfollow', 'heart', 'pasand'],
    answer:
      'Feed par ❤️ se like, 💬 se comment, aur creator ki profile par jaa kar Follow/Unfollow karo. Yeh sab Supabase mein save hota hai.',
  },
  {
    id: 'account',
    keywords: ['login', 'signup', 'sign up', 'log out', 'logout', 'password', 'account banao'],
    answer:
      'Signup/Login Supabase Auth se hota hai. Log out Profile page (ya Settings) se hota hai. Aapka data Supabase mein aur video files Cloudinary mein save hote hain.',
  },
  {
    id: 'greeting',
    keywords: ['hi', 'hello', 'salam', 'assalam', 'hey', 'kaise ho', 'aoa'],
    answer:
      'Assalam-o-alaikum! Main Hunar ka AI guide hoon. App ke kisi bhi feature ke bare mein poochho — jaise "video kaise banaun", "Earning kya hai", ya "offline videos kahan hain".',
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank', 'shukriya', 'meherbani', 'thank you'],
    answer: 'Koi baat nahi! Aur kuch poochhna ho to bataiye. 😊',
  },
]

const FALLBACK =
  'Main Hunar ka guide hoon. Aap app ke kisi bhi feature ke bare mein pooch sakte hain.'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\u0600-\u06FF\s]/g, ' ')
}

/** Returns the best-matching answer for a free-form question (keyword-based fallback). */
export function askAssistant(question: string): string {
  const q = ' ' + normalize(question) + ' '
  let best: { topic: AssistantTopic; score: number } | null = null

  for (const topic of topics) {
    let score = 0
    for (const kw of topic.keywords) {
      const k = normalize(kw).trim()
      if (!k) continue
      if (q.includes(' ' + k + ' ') || q.includes(k)) {
        score += k.includes(' ') ? 2 : 1
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score }
    }
  }

  return best ? best.topic.answer : FALLBACK
}

/**
 * Get AI response using Google Gemini API with premium/quota checking
 */
export async function getAssistantResponse(userId: string, question: string): Promise<string> {
  return getAiResponse(userId, question)
}

export const suggestedQuestions = [
  'Video kaise banaun?',
  'Filters aur music kaise lagaun?',
  'Earning section kya hai?',
  'Offline videos kahan milti hain?',
  'Chat kaise karun?',
]
