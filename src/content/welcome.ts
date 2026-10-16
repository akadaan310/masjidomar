// Path of Welcome — general, widely shared guidance for first visits to a masjid.
// Items flagged `verify: true` describe Masjid Omar specifically and must be confirmed by staff
// before they are presented as fact; the UI labels them "To be confirmed by the masjid".

export type WelcomeStep = {
  id: string;
  en: { title: string; body: string[] };
  ar: { title: string; body: string[] };
  verify?: { en: string; ar: string };
};

export const WELCOME_STEPS: WelcomeStep[] = [
  {
    id: "welcome",
    en: {
      title: "You are welcome here",
      body: [
        "Masajid are open to visitors — whether you are Muslim, exploring Islam, or simply curious about your neighbours.",
        "You do not need to know anything in advance or say anything. It is fine to come, sit quietly and observe.",
      ],
    },
    ar: {
      title: "أهلاً وسهلاً بك",
      body: [
        "المساجد مفتوحة للزوار، سواء كنت مسلمًا، أو تتعرّف على الإسلام، أو ترغب ببساطة في التعرّف على جيرانك.",
        "لا يلزمك أن تعرف شيئًا مسبقًا أو أن تقول شيئًا. يمكنك الحضور والجلوس بهدوء والمشاهدة.",
      ],
    },
  },
  {
    id: "prepare",
    en: {
      title: "Before you come",
      body: [
        "Wear comfortable, modest clothing that covers the arms and legs. Many women visitors choose to bring a light scarf for the prayer hall.",
        "Pick a time outside the main congregational prayer if you would like a quieter visit, or come a little before a prayer to see it.",
      ],
    },
    ar: {
      title: "قبل زيارتك",
      body: [
        "ارتدِ ملابس مريحة ومحتشمة تغطي الذراعين والساقين. تختار كثير من الزائرات إحضار وشاح خفيف لقاعة الصلاة.",
        "اختر وقتًا خارج صلاة الجماعة إن أردت زيارة أهدأ، أو احضر قبل إحدى الصلوات بقليل لتشاهدها.",
      ],
    },
    verify: {
      en: "Visitor hours and the best times to visit Masjid Omar are to be confirmed by the masjid.",
      ar: "أوقات الزيارة المناسبة لمسجد عمر بانتظار تأكيد المسجد.",
    },
  },
  {
    id: "arrive",
    en: {
      title: "When you arrive",
      body: [
        "Shoes are taken off before stepping onto the prayer carpet; you will usually see shelves near the entrance.",
        "Muslims perform a short washing (wudu) before prayer. Visitors who are only observing do not need to.",
      ],
    },
    ar: {
      title: "عند وصولك",
      body: [
        "تُخلع الأحذية قبل الدخول إلى سجاد الصلاة، وغالبًا ستجد رفوفًا قرب المدخل.",
        "يتوضأ المسلمون قبل الصلاة. أما الزائر الذي يكتفي بالمشاهدة فلا يلزمه ذلك.",
      ],
    },
    verify: {
      en: "Entrance, shoe shelves, washing areas, parking and accessibility details for Masjid Omar are to be confirmed by the masjid.",
      ar: "تفاصيل المدخل ورفوف الأحذية وأماكن الوضوء والمواقف وإمكانية الوصول في مسجد عمر بانتظار تأكيد المسجد.",
    },
  },
  {
    id: "prayer",
    en: {
      title: "During the prayer",
      body: [
        "The call to prayer (adhan) announces the time; the congregation stands in rows when the iqamah is called.",
        "If you are observing, sit quietly towards the back or side. Please avoid walking directly in front of someone who is praying, and keep phones silent.",
      ],
    },
    ar: {
      title: "أثناء الصلاة",
      body: [
        "يُعلن الأذان دخول وقت الصلاة، ويصطف المصلّون عند الإقامة.",
        "إن كنت تشاهد فقط، فاجلس بهدوء في الخلف أو على الجانب، وتجنّب المرور أمام المصلّي مباشرة، واجعل هاتفك صامتًا.",
      ],
    },
  },
  {
    id: "connect",
    en: {
      title: "Meeting people and asking questions",
      body: [
        "After prayer is a good moment to say hello. People are generally happy to answer questions.",
        "You can also ask the imam privately online — only you and authorised imam staff can read your question.",
      ],
    },
    ar: {
      title: "التعارف وطرح الأسئلة",
      body: [
        "بعد الصلاة وقت مناسب لإلقاء التحية، وعادةً ما يسعد الناس بالإجابة عن الأسئلة.",
        "يمكنك أيضًا أن تسأل الإمام سؤالًا خاصًا عبر الموقع، ولا يطّلع عليه إلا أنت والإمام المخوَّل.",
      ],
    },
  },
  {
    id: "new-muslim",
    en: {
      title: "If you are new to Islam",
      body: [
        "Take your time. Learning happens step by step, and no question is too basic.",
        "Speak with the imam about your situation — in person or through a private question — rather than relying on any website, including this one.",
      ],
    },
    ar: {
      title: "إن كنت جديدًا في الإسلام",
      body: [
        "خذ وقتك؛ فالتعلّم يكون خطوة بخطوة، ولا يوجد سؤال بسيط أكثر من اللازم.",
        "تحدّث مع الإمام عن وضعك، حضوريًا أو بسؤال خاص، بدلًا من الاعتماد على أي موقع، بما في ذلك هذا الموقع.",
      ],
    },
    verify: {
      en: "Classes or mentoring for new Muslims at Masjid Omar are to be confirmed; see Programs for anything the masjid has published.",
      ar: "الدروس أو المرافقة للمسلمين الجدد في مسجد عمر بانتظار التأكيد؛ راجع صفحة البرامج لما ينشره المسجد.",
    },
  },
];
