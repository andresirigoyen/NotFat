export type MessageTone = 'friendly' | 'aggressive';

export interface CoachCategoryMessages {
  friendly: string[];
  aggressive: string[];
}

export const COACH_MESSAGES: Record<string, CoachCategoryMessages> = {
  general: {
    friendly: [
      "¡Vamos por un excelente día!",
      "Confía en el proceso, cada paso cuenta.",
      "Eres capaz de lograr todo lo que te propongas.",
      "Pequeños cambios hacen grandes diferencias."
    ],
    aggressive: [
      "¿Sigues sentado? Tu metabolismo está de vacaciones...",
      "¿Mañana? Mañana es la excusa favorita de los que nunca logran nada.",
      "No eres un árbol, puedes moverte...",
      "La vida es mejor cuando puedes subir escaleras sin pedir una ambulancia.",
      "¿Flojera hoy? El espejo no miente...",
      "Tu zona de confort es una jaula dorada. ¡Sal ya!"
    ]
  },
  hydration: {
    friendly: [
      "Recuerda mantenerte hidratado.",
      "Beber agua te ayuda a sentirte con más energía.",
      "Un vaso de agua ahora es una buena idea."
    ],
    aggressive: [
      "Bebe agua. Sí, ahora...",
      "Tu cuerpo no es un desierto, deja de secarte.",
      "¿Prefieres estar hinchado o beber un maldito vaso de agua?",
      "Tus órganos están pidiendo auxilio. Hidrátate.",
      "El café no es agua. El refresco no es agua. ¡BEBE AGUA!",
      "¿Quieres una piel de pasa? Entonces sigue sin beber."
    ]
  },
  nutrition: {
    friendly: [
      "Elige alimentos que nutran tu cuerpo.",
      "Comer balanceado es quererte a ti mismo.",
      "Disfruta de tu comida con consciencia."
    ],
    aggressive: [
      "Esa hamburguesa no se va a quemar sola...",
      "Deja de tratar a tu cuerpo como un basurero.",
      "O controlas lo que comes, o la comida te controlará a ti.",
      "¿Hambre o aburrimiento? Conócete un poco.",
      "Eso que vas a comer tiene más químicos que la tabla periódica.",
      "Tus abdominales están debajo de esa pizza. Búscalos."
    ]
  },
  workout: {
    friendly: [
      "¡Buen momento para un poco de ejercicio!",
      "Hacer actividad física te hará sentir genial.",
      "Cada repetición te acerca a tu meta."
    ],
    aggressive: [
      "El gimnasio te está esperando... tú qué haces ahí?",
      "¿Cansado? Cansada estará tu ropa de que no la llenes con músculo.",
      "Suda ahora o llora en el probador después.",
      "Tu única competencia es el que viste ayer en el espejo, y te va ganando.",
      "¿Dolor? Se llama debilidad saliendo de tu cuerpo.",
      "No cuentes los días, haz que los días cuenten (y hoy vas en cero)."
    ]
  },
  steps: {
    friendly: [
      "¡Sigue caminando, vas muy bien!",
      "Cada paso es un avance hacia tu salud.",
      "Un pequeño paseo puede cambiar tu humor."
    ],
    aggressive: [
      "¿Eso es todo lo que has caminado? Mi abuela se mueve más durmiendo.",
      "Levántate y camina, tus piernas no son decorativas.",
      "Mueve el esqueleto, se está oxidando de tanto estar quieto.",
      "¿Ese es tu ritmo? Un pingüino herido te adelantaría.",
      "Cada paso que NO das es un paso hacia el hospital.",
      "Tu sofá no te va a llevar a tus metas. ¡Camina!"
    ]
  },
  registration: {
    friendly: [
      "¡Buen provecho! Registrar esto nos ayudará a mantener el equilibrio hoy. ✨",
      "Qué bien se ve eso. ¡A disfrutar!",
      "Cada registro es un paso más hacia tu meta consciente."
    ],
    aggressive: [
      "¿De verdad te vas a comer eso? Registra tu fracaso.",
      "Espero que al menos sepa bien, porque tus macros van a sufrir.",
      "Registrando otra mala decisión... adelante."
    ]
  },
  failure: {
    friendly: [
      "No pasa nada, un día no define tu progreso. Mañana volvemos con todo. 💪",
      "Los baches en el camino son parte del viaje. ¡Tú puedes!",
      "Mañana es una nueva oportunidad para brillar."
    ],
    aggressive: [
      "Tu fuerza de voluntad es inexistente. Mañana será peor.",
      "Fallas de nuevo. El Coach está decepcionado.",
      "Si sigues así, el único progreso que verás será en tu talla de pantalón."
    ]
  }
};
