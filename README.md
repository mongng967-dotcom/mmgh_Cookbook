# 🍳 Cookbook_V1
**Your Intelligent Kitchen Companion**

Cookbook_V1 is a modern React Native application designed for food enthusiasts who want to bridge the gap between their physical fridge and digital recipe library. Powered by **Gemini 2.5 Flash AI** and **Supabase**, this app transforms how you manage ingredients and discover dishes.

## 📱 User Flow Experience

### 1. Authentication & Cloud Storage
Upon opening the app, you are greeted by a clean, card-based dashboard. Signing in with Google ensures your personal cookbook and inventory are synced to the cloud and available on any device, so You **NEVER** lose your frige ingredients list and recipes!

<img width="1206" height="2622" alt="Simulator Screenshot - iPhone 17 Pro - 2026-03-24 at 10 10 28" src="https://github.com/user-attachments/assets/517f706e-fdf3-465e-97eb-57757bf9ccf1" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 13 58 26" src="https://github.com/user-attachments/assets/f386c1bb-efbf-4d77-b309-eddf41f03d5d" />

---

### 2. Scanning the Fridge
Stop manual typing. Navigate to **Inventory** and select **Scan Album**. Simply take a photo of your fridge, and the AI begins processing to identify your stock immediately. The AI identifies ingredients and presents them for review. You can tap any item to edit the name, translation (EN/ZH), or category, ensuring your inventory is 100% accurate before saving.

<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 13 58 44" src="https://github.com/user-attachments/assets/26124b92-7112-44aa-9713-aaf608874e6b" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 13 59 04" src="https://github.com/user-attachments/assets/28aea05b-b00f-4707-816e-abe754bd1f1d" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 13 59 10" src="https://github.com/user-attachments/assets/8fe0de36-73ca-4dcb-91c3-b3639ccd445c" />

---

### 3. Managed Inventory
Once saved, your ingredients are beautifully categorized. The app automatically compares these against recipe requirements to show you what is **"In Stock"** versus what is **"Missing"**.

<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 14 04 12" src="https://github.com/user-attachments/assets/08064bbf-26f9-4d55-ba3d-d1fbd0f54b40" />

---

### 5. Creating AI Recipes
When adding a new dish, use the **AI Extract** tool. Upload a photo of a recipe card or a screenshot from a website, and the AI parses the ingredients and steps into a structured format.

<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 14 00 13" src="https://github.com/user-attachments/assets/d9233db3-fff1-49b9-9459-86206b911aca" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 14 00 18" src="https://github.com/user-attachments/assets/c0dd19a3-54fe-4652-bb13-9863e511862a" />

---

### 6. Starter Library
Access the **Starter Recipes** to browse over preset recipes. Each preset can be viewed in detail and "Imported" into your personal collection using a lightweight pointer system.

<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 14 00 43" src="https://github.com/user-attachments/assets/fc033ca4-0a8e-469a-86ee-d87b5a7263d0" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 14 00 56" src="https://github.com/user-attachments/assets/39814cd3-4051-43f9-95eb-19dca770da8b" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 16e - 2026-03-18 at 14 01 00" src="https://github.com/user-attachments/assets/03fab2c6-3a94-47d1-95cc-c88da47ca64f" />

---

### 7. Smart Shopping List
Never forget an ingredient again. When browsing your cookbook or starter recipes, tap the shopping cart icon next to any missing ingredient to instantly add it to your list. The Shopping List groups items by category with beautiful, blended backgrounds and allows you to easily check them off with a single tap once you have picked them up at the store.

<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 17 Pro - 2026-03-24 at 01 16 42" src="https://github.com/user-attachments/assets/9660606b-e613-4385-94c0-33f3868bb818" />
<img width="292.5" height="633" alt="Simulator Screenshot - iPhone 17 Pro - 2026-03-24 at 01 16 25" src="https://github.com/user-attachments/assets/ec1cf386-2c2f-4c00-8c77-c012bd72208f" />


---

## 🛠 Installation & Setup

To run this project locally, you must provide your own API keys. 

1. **Clone the repo**: `git clone https://github.com/mongng967-dotcom/mmgh_Cookbook.git`
2. **Install dependencies**: `npm install`
3. **Configure Environment**: Create a `.env` file in the root directory and add the following:

```text
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Google Auth
GOOGLE_CLIENT_ID=your_google_oauth_client_id
