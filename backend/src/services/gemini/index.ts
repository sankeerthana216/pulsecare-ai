import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK if API key is provided
let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export class GeminiService {
  /**
   * Analyze active vital telemetry and generate a brief professional clinical message
   */
  public static async generateVitalsAnalysis(
    profile: { name: string; age: number; gender: string },
    vitals: { heartRate: number; temperature: number; oxygenLevel: number; bloodPressure: string },
    status: 'NORMAL' | 'ELEVATED' | 'EMERGENCY'
  ): Promise<string> {
    const prompt = `
      You are PulseCare AI, an advanced AI health assistant. Analyze the following health vitals for a patient:
      - Name: ${profile.name}
      - Age: ${profile.age} years old
      - Gender: ${profile.gender}
      
      Vitals telemetry recorded:
      - Heart Rate: ${vitals.heartRate} BPM
      - Body Temperature: ${vitals.temperature}°C
      - Blood Oxygen (SpO2): ${vitals.oxygenLevel}%
      - Blood Pressure: ${vitals.bloodPressure}
      
      Status category determined by engine: ${status}
      
      Provide a brief (max 2 sentences), professional, clear, and action-oriented clinical summary. 
      Do not diagnose. Give immediate practical health advice suitable for this status.
    `;

    try {
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) return text;
      }
    } catch (err) {
      console.error('Gemini API call failed, using rule-based fallback:', err);
    }

    // Expert Rule-Based Fallback System
    return this.getVitalsAnalysisFallback(profile, vitals, status);
  }

  /**
   * Handle symptom checker chatbot triage conversations
   */
  public static async generateChatTriage(
    messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
    language: string
  ): Promise<string> {
    const conversationHistory = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts.map((p) => p.text).join(' ')}`)
      .join('\n');

    const prompt = `
      You are the PulseCare AI Triage Assistant. Help the patient assess their symptoms.
      Respond in the requested language: "${language}".
      
      Conversation history:
      ${conversationHistory}
      
      Guidelines:
      - Provide a supportive, calm tone.
      - Conduct basic triage: ask clarifying questions if needed (e.g. onset, severity).
      - Include a prominent disclaimer that this is informational only and does not replace professional medical advice.
      - Suggest when they should seek professional care or call emergency services (e.g., if chest pain, shortness of breath, or high fever occur).
    `;

    try {
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) return text;
      }
    } catch (err) {
      console.error('Gemini Chat API call failed, using rule-based fallback:', err);
    }

    // Expert Rule-Based Triage Fallback
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    const queryText = lastUserMessage
      ? lastUserMessage.parts.map((p) => p.text).join(' ').toLowerCase()
      : '';

    return this.getChatTriageFallback(queryText, language);
  }

  private static getVitalsAnalysisFallback(
    profile: { name: string; age: number; gender: string },
    vitals: { heartRate: number; temperature: number; oxygenLevel: number; bloodPressure: string },
    status: 'NORMAL' | 'ELEVATED' | 'EMERGENCY'
  ): string {
    if (status === 'EMERGENCY') {
      if (vitals.oxygenLevel < 90) {
        return `CRITICAL Alert: Dangerous blood oxygen level saturation (${vitals.oxygenLevel}%) detected. Sit upright, focus on deep, regular breathing, and prepare to dial emergency services immediately if your breathing fails to stabilize.`;
      }
      if (vitals.heartRate > 170) {
        return `CRITICAL Alert: Dangerous tachycardia (${vitals.heartRate} BPM) detected. Please immediately stop all physical activities, sit down, breathe slowly to calm your pulse, and contact emergency assistance if you experience chest tightness or dizziness.`;
      }
      return `CRITICAL Alert: Severe vital anomalies detected (Temp: ${vitals.temperature}°C, HR: ${vitals.heartRate} BPM). We strongly advise calling your emergency contact or local emergency services immediately for professional evaluation.`;
    }

    if (status === 'ELEVATED') {
      if (vitals.temperature > 37.8) {
        return `Notice: Elevated body temperature of ${vitals.temperature}°C suggests a mild fever. Please rest, drink plenty of water, and keep monitoring your temperature hourly. Contact a healthcare provider if it rises above 38.5°C.`;
      }
      if (vitals.heartRate > 100) {
        return `Notice: Your heart rate of ${vitals.heartRate} BPM is elevated for your profile. We suggest resting quietly for 10 minutes, avoiding caffeine, and taking another reading. If it remains high, reach out to your doctor.`;
      }
      return `Notice: Slightly elevated vitals detected. We recommend sitting quietly, rehydrating, and checking your measurements again in 15 minutes.`;
    }

    return 'Your vital signs (Heart Rate, Temperature, and Blood Oxygen) are fully stable and within safe normal parameters. Continue your wellness routine!';
  }

  private static getChatTriageFallback(query: string, language: string): string {
    // Basic multi-language greetings/disclaimers
    const disclaimers: Record<string, string> = {
      en: 'Disclaimer: This tool is for informational triage purposes and is not a professional diagnosis.',
      es: 'Descargo de responsabilidad: Esta herramienta tiene fines informativos de clasificación y no es un diagnóstico profesional.',
      fr: 'Avertissement: Cet outil est destiné au triage informatif et ne remplace pas un diagnostic médical professionnel.',
      de: 'Haftungsausschluss: Dieses Tool dient zu Informationszwecken und ersetzt keine professionelle medizinische Diagnose.',
      hi: 'अस्वीकरण: यह उपकरण केवल सूचनात्मक जांच के लिए है और पेशेवर निदान का विकल्प नहीं है।',
      ar: 'إخلاء المسؤولية: هذه الأداة مخصصة لفرز المعلومات وليست تشخيصاً طبياً متخصصاً.',
      zh: '免责声明：本工具仅用于提供信息分流，不能替代专业医疗诊断。',
      pt: 'Aviso legal: Esta ferramenta serve apenas para triagem informativa e não constitui um diagnóstico profissional.',
      bn: 'দাবিত্যাগ: এই সরঞ্জামটি শুধুমাত্র প্রাথমিক যাচাইকরণের জন্য এবং পেশাদার চিকিৎসার বিকল্প নয়।',
      ur: 'ڈس کلیمر: یہ ٹول صرف معلوماتی مقاصد کے لیے ہے اور کسی پیشہ ورانہ تشخیص کا متبادل نہیں ہے۔',
      ru: 'Предупреждение: Этот инструмент предназначен для информационного триажа и не является профессиональным медицинским диагнозом.',
      ja: '免責事項：このツールは情報提供のみを目的としており、専門的な診断に代わるものではありません。',
    };

    const disclaimer = disclaimers[language] || disclaimers['en'];

    // If severe symptoms are detected
    if (
      query.includes('chest pain') ||
      query.includes('shortness of breath') ||
      query.includes('breathing') ||
      query.includes('ahogo') ||
      query.includes('dolor de pecho')
    ) {
      if (language === 'es') {
        return `**${disclaimer}**\n\n⚠️ **ATENCIÓN DE EMERGENCIA:** Los dolores en el pecho o la dificultad para respirar pueden ser signos de una condición grave. Por favor, llame inmediatamente a su número local de emergencias (e.g., 911/112) o diríjase a la sala de emergencias más cercana.`;
      }
      return `**${disclaimer}**\n\n⚠️ **EMERGENCY WARNING:** Chest pain, severe pressure, or shortness of breath can indicate a life-threatening medical emergency. **Please contact your local emergency services (like 911) immediately.** Do not wait.`;
    }

    if (query.includes('fever') || query.includes('temp') || query.includes('fiebre') || query.includes('fièvre')) {
      if (language === 'es') {
        return `**${disclaimer}**\n\nEl aumento de temperatura corporal suele indicar una respuesta inmunitaria activa. Le recomendamos descansar, hidratarse con abundante agua y evitar el exceso de ropa. Si su temperatura supera los 39°C o persiste por más de 3 días, consulte a un médico.`;
      }
      return `**${disclaimer}**\n\nAn elevated temperature is a standard response to infection. Rest, consume clear fluids, and monitor your vitals. If your body temperature exceeds 39°C (102.2°F) or is accompanied by a severe headache or stiff neck, seek professional medical attention.`;
    }

    if (
      query.includes('cough') ||
      query.includes('throat') ||
      query.includes('cold') ||
      query.includes('garganta') ||
      query.includes('tos')
    ) {
      if (language === 'es') {
        return `**${disclaimer}**\n\nLos síntomas de resfriado o dolor de garganta son muy comunes. Se recomienda descansar la voz, tomar bebidas tibias y miel (si es mayor de un año). Controle que no suba la fiebre. Si empeora o tiene dificultades para tragar, visite a un médico.`;
      }
      return `**${disclaimer}**\n\nCough and sore throat symptoms are typical of common viral respiratory infections. Rest, drink warm tea or fluids, and use saline gargles. Please consult a doctor if your symptoms persist beyond a week, or if you develop difficulty swallowing or breathing.`;
    }

    // Default general response
    if (language === 'es') {
      return `**${disclaimer}**\n\nGracias por describir sus síntomas. Para poder ayudarle mejor, ¿podría indicarme cuándo empezaron y si tiene fiebre u otros síntomas? Recuerde descansar y vigilar sus constantes vitales en el panel principal.`;
    }
    return `**${disclaimer}**\n\nThank you for sharing your symptoms. To help triage more effectively, please let me know: How long have you felt this way, and are you experiencing any fever, pain, or breathing difficulties? Remember to monitor your vitals on the main dashboard and seek a physician's advice.`;
  }
}
