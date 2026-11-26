import { toBnDigits, type Lang } from "./dict";

/**
 * Bangla for messages produced on the server (validation, actions, services, notifications).
 * Server code stays in English (logs, admin, API); text is translated where it is shown to customers.
 */
const EXACT: Record<string, string> = {
  // validation
  "Please enter a valid email address.": "সঠিক ইমেইল ঠিকানা দিন।",
  "Please enter a valid email.": "সঠিক ইমেইল ঠিকানা দিন।",
  "Password is too long.": "পাসওয়ার্ড অনেক লম্বা।",
  "Password must be at least 8 characters.": "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
  "Password must contain a number.": "পাসওয়ার্ডে অন্তত একটি সংখ্যা থাকতে হবে।",
  "Password must contain a letter.": "পাসওয়ার্ডে অন্তত একটি অক্ষর থাকতে হবে।",
  "Please enter your password.": "পাসওয়ার্ড দিন।",
  "Please enter your full name.": "আপনার পুরো নাম দিন।",
  "Please enter your name.": "আপনার নাম দিন।",
  "Please enter a valid phone number.": "সঠিক ফোন নম্বর দিন।",
  "Please enter the recipient’s name.": "প্রাপকের নাম দিন।",
  "Please enter house / street.": "বাড়ি / রাস্তার ঠিকানা দিন।",
  "Please enter the area / locality.": "এলাকা / মহল্লার নাম দিন।",
  "Please enter the city.": "শহরের নাম দিন।",
  "Please choose a delivery area.": "ডেলিভারি এলাকা বাছাই করুন।",
  "Please choose a delivery date.": "ডেলিভারির তারিখ বাছাই করুন।",
  "Please choose a delivery time slot.": "ডেলিভারির সময় বাছাই করুন।",
  "Please choose a date in the next 3 days.": "আগামী ৩ দিনের মধ্যে একটি তারিখ বাছাই করুন।",
  "Please choose a valid time slot.": "সঠিক সময় বাছাই করুন।",
  "Please choose a payment method.": "পেমেন্ট পদ্ধতি বাছাই করুন।",
  "This payment method is not available.": "এই পেমেন্ট পদ্ধতিটি এখন চালু নেই।",
  "Please choose an address.": "একটি ঠিকানা বাছাই করুন।",
  "Please choose a rating.": "রেটিং বাছাই করুন।",
  "Please write at least 10 characters.": "কমপক্ষে ১০ অক্ষর লিখুন।",
  "Message should be at least 10 characters.": "বার্তা কমপক্ষে ১০ অক্ষরের হতে হবে।",
  "Please add a subject.": "একটি বিষয় লিখুন।",
  "Please accept the terms to continue.": "এগিয়ে যেতে শর্তাবলিতে সম্মতি দিন।",
  "Passwords don’t match.": "দুটি পাসওয়ার্ড মিলছে না।",
  "Current password is incorrect.": "বর্তমান পাসওয়ার্ড সঠিক নয়।",
  "Please check the highlighted fields.": "চিহ্নিত ঘরগুলো ঠিক করুন।",
  "Please complete your delivery address.": "ডেলিভারির ঠিকানা সম্পূর্ণ করুন।",
  "Please fix the highlighted fields.": "চিহ্নিত ঘরগুলো ঠিক করুন।",
  // auth
  "Incorrect email or password.": "ইমেইল বা পাসওয়ার্ড সঠিক নয়।",
  "This account has been suspended. Please contact support.": "এই অ্যাকাউন্টটি স্থগিত করা হয়েছে। সহায়তায় যোগাযোগ করুন।",
  "This account does not have admin access.": "এই অ্যাকাউন্টে অ্যাডমিন প্রবেশাধিকার নেই।",
  "An account with this email already exists. Try signing in.": "এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করে দেখুন।",
  "Too many sign-in attempts. Please wait 15 minutes and try again.": "অনেকবার লগইনের চেষ্টা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।",
  "Too many sign-ups from this network. Please try later.": "এই নেটওয়ার্ক থেকে অনেকবার রেজিস্টার করা হয়েছে। পরে চেষ্টা করুন।",
  "If an account exists for that email, we’ve sent a reset link. It expires in 60 minutes.": "এই ইমেইলে অ্যাকাউন্ট থাকলে আমরা রিসেট লিংক পাঠিয়েছি। লিংকটি ৬০ মিনিট কার্যকর থাকবে।",
  "This reset link is invalid.": "এই রিসেট লিংকটি সঠিক নয়।",
  "This reset link has expired or was already used. Please request a new one.": "লিংকটির মেয়াদ শেষ বা আগেই ব্যবহার হয়েছে। নতুন লিংক চান।",
  "Too many requests. Please try later.": "অনেকবার চেষ্টা হয়েছে। পরে চেষ্টা করুন।",
  "Too many attempts. Please try later.": "অনেকবার চেষ্টা হয়েছে। পরে চেষ্টা করুন।",
  "Too many attempts. Please wait a few minutes.": "অনেকবার চেষ্টা হয়েছে। কয়েক মিনিট অপেক্ষা করুন।",
  "Too many messages. Please try again later.": "অনেক বার্তা পাঠানো হয়েছে। পরে আবার চেষ্টা করুন।",
  // account
  "Profile updated.": "প্রোফাইল আপডেট হয়েছে।",
  "Password changed. Other devices have been signed out.": "পাসওয়ার্ড বদলানো হয়েছে। অন্য ডিভাইস থেকে লগআউট করা হয়েছে।",
  "Address saved.": "ঠিকানা সংরক্ষণ হয়েছে।",
  "Address not found.": "ঠিকানা পাওয়া যায়নি।",
  "You can save up to 10 addresses.": "সর্বোচ্চ ১০টি ঠিকানা সংরক্ষণ করা যায়।",
  "Invalid order.": "অর্ডারটি সঠিক নয়।",
  "Your order has been cancelled.": "আপনার অর্ডার বাতিল করা হয়েছে।",
  "This order can no longer be cancelled. Please contact support.": "এই অর্ডার এখন আর বাতিল করা যাবে না। সহায়তায় যোগাযোগ করুন।",
  "Order not found.": "অর্ডার পাওয়া যায়নি।",
  // misc
  "Thanks for subscribing! Watch your inbox for fresh deals.": "সাবস্ক্রাইব করার জন্য ধন্যবাদ! তাজা অফারের জন্য ইনবক্সে চোখ রাখুন।",
  "Message sent! Our team will reply within one business day.": "বার্তা পাঠানো হয়েছে! আমাদের টিম এক কর্মদিবসের মধ্যে উত্তর দেবে।",
  "Please sign in to write a review.": "রিভিউ লিখতে লগইন করুন।",
  "Only customers who received this product can review it (once).": "যারা পণ্যটি হাতে পেয়েছেন, শুধু তারাই একবার রিভিউ দিতে পারবেন।",
  "Thank you! Your review will appear after moderation.": "ধন্যবাদ! যাচাইয়ের পর আপনার রিভিউ দেখা যাবে।",
  // checkout / coupons
  "Your cart is empty.": "আপনার কার্ট খালি।",
  "Invalid checkout session. Please reload the page.": "চেকআউট সেশন সঠিক নয়। পেজটি আবার লোড করুন।",
  "Please choose a valid delivery area.": "সঠিক ডেলিভারি এলাকা বাছাই করুন।",
  "Something went wrong while placing your order. You have not been charged. Please try again.": "অর্ডার করার সময় সমস্যা হয়েছে। আপনার কাছ থেকে কোনো টাকা নেওয়া হয়নি। আবার চেষ্টা করুন।",
  "This coupon code is not valid.": "এই কুপন কোডটি সঠিক নয়।",
  "This coupon is not active yet.": "এই কুপনটি এখনো চালু হয়নি।",
  "This coupon has expired.": "এই কুপনের মেয়াদ শেষ।",
  "This coupon has reached its usage limit.": "এই কুপনের ব্যবহারের সীমা শেষ।",
  "You have already used this coupon.": "আপনি এই কুপনটি আগেই ব্যবহার করেছেন।",
  "Online payment is not configured.": "অনলাইন পেমেন্ট এখনো চালু করা হয়নি।",
  "Could not reach the payment gateway. Please try again.": "পেমেন্ট গেটওয়েতে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।",
  "The payment gateway rejected the request. Please try again or choose cash on delivery.": "পেমেন্ট গেটওয়ে অনুরোধটি গ্রহণ করেনি। আবার চেষ্টা করুন অথবা ক্যাশ অন ডেলিভারি বেছে নিন।",
  // order history notes & notifications
  "Order placed by customer": "গ্রাহক অর্ডার করেছেন",
  "Cash payment collected": "নগদ পেমেন্ট গ্রহণ করা হয়েছে",
  "Cancelled by customer": "গ্রাহক বাতিল করেছেন",
  "Cancelled by store": "দোকান বাতিল করেছে",
  "Your order was cancelled.": "আপনার অর্ডার বাতিল করা হয়েছে।",
  "Your order was cancelled. Our team will contact you about your refund.": "আপনার অর্ডার বাতিল করা হয়েছে। রিফান্ডের বিষয়ে আমাদের টিম যোগাযোগ করবে।",
};

const STATUS_BN: Record<string, string> = {
  "Order placed": "অর্ডার সম্পন্ন",
  "Order confirmed": "অর্ডার নিশ্চিত হয়েছে",
  "Being packed": "প্যাক করা হচ্ছে",
  "Out for delivery": "ডেলিভারিতে বের হয়েছে",
  Delivered: "ডেলিভারি হয়েছে",
  Cancelled: "বাতিল",
};

const RULES: [RegExp, (...m: string[]) => string][] = [
  [/^Minimum order of (.+) required for this coupon\.$/, (a) => `এই কুপনের জন্য সর্বনিম্ন ${a}-এর অর্ডার লাগবে।`],
  [/^Minimum order value is (.+)\.$/, (a) => `সর্বনিম্ন অর্ডার ${a}।`],
  [/^Sorry, (.+) just ran out of stock\.$/, (p) => `দুঃখিত, ${p} এইমাত্র শেষ হয়ে গেছে।`],
  [/^(.+) \((.+)\): (.+)\. Please update your cart\.$/, (p, v, issue) => `${p} (${v}): ${issueBn(issue)}। কার্ট আপডেট করুন।`],
  [/^Only (\d+) left$/, (n) => `মাত্র ${n}টি বাকি`],
  [/^Order (\S+) placed$/, (n) => `অর্ডার ${n} সম্পন্ন হয়েছে`],
  [/^Order (\S+) cancelled$/, (n) => `অর্ডার ${n} বাতিল হয়েছে`],
  [/^Order (\S+): (.+)$/, (n, s) => `অর্ডার ${n}: ${STATUS_BN[s] ?? s}`],
  [/^Thanks! Your order total is (.+)\.$/, (a) => `ধন্যবাদ! আপনার অর্ডারের মোট মূল্য ${a}।`],
  [/^Your order is now "(.+)"\.$/, (s) => `আপনার অর্ডারের অবস্থা এখন “${STATUS_BN[s] ?? s}”।`],
  [/^(Cancelled by customer|Cancelled by store): (.+)$/, (who, r) => `${EXACT[who]}: ${r}`],
  [/^Online payment received \((.+)\)$/, (t) => `অনলাইন পেমেন্ট পাওয়া গেছে (${t})`],
];

/** Bengali digits, but order numbers / transaction ids (FM-…, COD-…) keep Latin digits so customers can quote them. */
function bnDigitsExceptCodes(text: string) {
  return text.split(/((?:FM|COD)-[A-Z0-9-]+)/).map((part, i) => (i % 2 ? part : toBnDigits(part))).join("");
}

function issueBn(issue: string) {
  if (issue === "No longer available") return "আর পাওয়া যাচ্ছে না";
  if (issue === "Out of stock") return "স্টকে নেই";
  const m = issue.match(/^Only (\d+) left$/);
  return m ? `মাত্র ${m[1]}টি বাকি` : issue;
}

/** Translate a server-produced English message for display. Unknown text is returned unchanged. */
export function tMsg(text: string | null | undefined, lang: Lang): string {
  if (!text) return "";
  if (lang !== "bn") return text;
  const exact = EXACT[text];
  if (exact) return exact;
  for (const [re, fn] of RULES) {
    const m = text.match(re);
    if (m) return bnDigitsExceptCodes(fn(...m.slice(1)));
  }
  return text;
}

/** Translate every message in an action state ({ message, errors }). */
export function tState<T extends { message?: string; errors?: Record<string, string> } | null>(state: T, lang: Lang): T {
  if (!state || lang !== "bn") return state;
  const errors = state.errors ? Object.fromEntries(Object.entries(state.errors).map(([k, v]) => [k, tMsg(v, lang)])) : undefined;
  return { ...state, message: state.message ? tMsg(state.message, lang) : state.message, errors };
}
