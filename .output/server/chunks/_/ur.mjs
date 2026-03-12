var languages = {
	en: "English",
	ar: "العربية",
	ur: "اردو"
};
var home = {
	skills: {
		speaking: {
			title: "بات چیت",
			desc: "لیٹر کارڈز کا استعمال کرکے ٹائپ کریں اور AI پاورڈ کمیونیکیشن سے بات کریں"
		},
		email: {
			title: "ای میل",
			desc: "مددگار لکھائی کے ساتھ ای میلز لکھیں اور بھیجیں"
		},
		social: {
			title: "سوشل میڈیا",
			desc: "سوشل پلیٹ فارمز پر پوسٹ کریں اور انٹریکٹ کریں"
		}
	},
	hint: "بات چیت شروع کرنے کے لیے سپیس یا انٹر دبائیں",
	calibration: {
		title: "بٹنز کلک کرتے وقت اپنی آنکھوں سے کرسر کو فالو کریں",
		done: "ہو گیا"
	}
};
var speaking = {
	placeholder: "ٹائپ کرنے کے لیے حروف منتخب کریں...",
	actions: {
		backspace: "پیچھے",
		enter: "پھیلائیں",
		loading: "پھیلایا جا رہا ہے..."
	},
	suggestions: {
		speak: "بولیں",
		back: "پیچھے",
		hintCycle: "لفظوں کو چکر لگانے کے لیے اوپر/نیچے دیکھیں",
		hintActions: "بائیں پیچھے، دائیں بولیں"
	}
};
var settings = {
	title: "ترتیبات",
	close: "بند کریں",
	language: "زبان",
	general: {
		title: "عام",
		interactionMode: "انٹرایکشن موڈ",
		modes: {
			touch: "ٹچ",
			eyeGaze: "آنکھ کی نظر",
			"switch": "سوئچ"
		},
		eyeGaze: {
			title: "آنکھ کی نظر کی ترتیبات",
			calibrated: "کیلیبریٹڈ",
			notCalibrated: "کیلیبریٹڈ نہیں",
			recalibrate: "دوبارہ کیلیبریٹ کریں",
			calibrate: "کیلیبریٹ کریں",
			dwellTime: "ویل ٹائم",
			dwellHint: "ٹارگٹ کو منتخب کرنے سے پہلے اسے دیکھنے کا کتنا وقت",
			openMode: "آنکھ کی نظر موڈ کھولیں",
			tip: "ٹارگٹ کو منتخب کرنے کے لیے ویل ٹائم تک اسے دیکھیں۔ تصدیق کے لیے آنکھ ماریں۔"
		},
		debug: "ڈیبگ انفارمیشن"
	},
	appearance: {
		title: "ظہور",
		background: "بیک گراؤنڈ",
		accent: "ایسنٹ",
		text: "ٹیکسٹ"
	},
	sceneContext: {
		title: "منظر کا سیاق و سباق",
		placeholder: "بات چیت کرتے وقت منظر کیپچر کیا جائے گا",
		capture: "ابھی کیپچر کریں",
		capturing: "کیپچر ہو رہا ہے...",
		recapture: "منظر دوبارہ کیپچر کریں",
		analyzing: "منظر کا تجزیہ ہو رہا ہے...",
		failed: "تجزیہ ناکام ہو گیا",
		captured: "منظر کیپچر ہو گیا"
	},
	listening: {
		title: "سننا",
		start: "شروع کریں",
		active: "فعال",
		lastHeard: "آخری بار سنا:",
		listeningPlaceholder: "بات چیت کا انتظار ہو رہا ہے...",
		enablePlaceholder: "بات چیت سننے کے لیے فعال کریں"
	},
	situation: {
		title: "صورت حال",
		placeholder: "مثال کے طور پر، ہیکاتھون میں ہمارا AAC ایپ پیش کر رہے ہیں...",
		quickContexts: {
			hackathon: "ہیکاتھون",
			doctor: "ڈاکٹر",
			restaurant: "ریسٹورنٹ"
		}
	},
	cameras: {
		title: "کیمرے",
		webgazer: "آنکھ کی ٹریکنگ کیمرا",
		sceneCapture: "منظر کیپچر کیمرا",
		"default": "ڈیفالٹ کیمرا",
		noCameras: "کوئی کیمرا نہیں ملا",
		available: "{count} کیمرے دستیاب ہیں"
	},
	colors: {
		"default": "ڈیفالٹ",
		slate: "سیلیٹ",
		neutral: "نیوٹرل",
		gray: "گری",
		deepBlack: "گہرا سیاہ",
		blue: "نیلا",
		yellow: "پیلا",
		red: "سرخ",
		green: "سبز",
		purple: "جامنی",
		white: "سفید",
		amber: "ایمبر",
		sky: "آسمان"
	}
};
const ur = {
	languages: languages,
	home: home,
	speaking: speaking,
	settings: settings
};

export { ur as default, home, languages, settings, speaking };
//# sourceMappingURL=ur.mjs.map
