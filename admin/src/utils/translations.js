const dictionary = {
  en: {
    dashboard: "Dashboard",
    customers: "Customers",
    milkEntry: "Milk Entry",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    business: "Business",
    prefs: "Preferences",
    security: "Security",
    dairyDetails: "Dairy & Owner Details",
    dairyName: "Dairy Name",
    ownerName: "Owner Name",
    phone: "Phone Number",
    save: "Save Changes"
  },
  ta: {
    dashboard: "முகப்பு",
    customers: "வாடிக்கையாளர்கள்",
    milkEntry: "பால் பதிவு",
    reports: "அறிக்கைகள்",
    settings: "அமைப்புகள்",
    logout: "வெளியேறு",
    business: "வணிகம்",
    prefs: "விருப்பத்தேர்வுகள்",
    security: "பாதுகாப்பு",
    dairyDetails: "பண்ணை மற்றும் உரிமையாளர் விவரங்கள்",
    dairyName: "பண்ணை பெயர்",
    ownerName: "உரிமையாளர் பெயர்",
    phone: "தொலைபேசி எண்",
    save: "சேமி"
  }
};

export const getText = (key, lang) => {
  return dictionary[lang]?.[key] || key;
};