// IMPORT-FREE on purpose (see guide-quality.util.ts). Editorial copy is Spanish (es-CL) only.
// Rules for every field: verifiable facts only — no prices, no opening hours, no unsourced superlatives;
// flight info is "aprox."; never claim a visa outcome as law (the page shows the dataset's answer separately).
export interface CityGuideEntry {
  slug: string;
  cityId: string;
  displayName: string;
  wave: 1 | 2 | 3;
  timeZone: string;        // IANA — used for the "diferencia horaria con Chile" fact
  reviewed: boolean;       // owner-approved copy; only reviewed guides can be indexed
  domestic?: true;         // Chilean city: no "desde Chile" framing, no facts box, no visa FAQ
  mustSeeDayTrips?: string[]; // attraction ids pinned first in Imperdibles (day trips allowed), in this order
  intro: string;           // 2–3 sentences
  bestTime: string;        // one sentence: best seasons and why
  gettingThere: string;    // 1–2 sentences, from Chile, "aprox."
  tips: string[];          // 3–5 short practical tips
  faq: { q: string; a: string }[];   // 3–5, each answer a self-contained 1–3 sentences
}

export const HOME_TIME_ZONE = 'America/Santiago';

export const CITY_GUIDES: CityGuideEntry[] = [
  {
    slug: 'madrid',
    cityId: 'madrid',
    displayName: 'Madrid',
    wave: 1,
    timeZone: 'Europe/Madrid',
    reviewed: true,
    intro:
      'Madrid es la capital de España y una de las ciudades europeas con más museos y más vida de calle. En pocos días puedes recorrer el Triángulo del Arte (Prado, Reina Sofía y Thyssen), pasear por el Retiro y el Madrid de los Austrias, y salir de excursión a Toledo o Segovia.',
    bestTime:
      'Primavera (abril a junio) y otoño (septiembre y octubre) son las épocas más agradables; el verano es muy caluroso y el invierno es frío pero soleado.',
    gettingThere:
      'Desde Santiago hay vuelos con escala y, según la temporada, directos; el vuelo directo dura aprox. 13 horas. Del aeropuerto Madrid-Barajas al centro se llega en metro, cercanías o bus.',
    tips: [
      'Muchos museos tienen tramos de entrada gratuita o reducida en ciertos días y horarios: confírmalo en el sitio oficial de cada museo antes de ir.',
      'La cena es más tarde que en Chile: muchas cocinas abren recién desde las 20:30.',
      'El centro se recorre bien a pie; para distancias mayores el metro y los buses cubren casi toda la ciudad.',
      'Reserva con anticipación el Palacio Real y los museos principales en temporada alta para evitar filas.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Madrid?',
        a: 'Con 3 días recorres lo esencial: los museos principales, el Palacio Real, el Retiro y los barrios del centro. Con 4 o 5 días puedes sumar una excursión a Toledo o Segovia.',
      },
      {
        q: '¿Necesito visa para viajar a Madrid desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a España (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Madrid en un día?',
        a: 'Las más populares son Toledo, Segovia, El Escorial y Alcalá de Henares. Todas quedan a poca distancia y se pueden hacer en tren o bus.',
      },
    ],
  },
  {
    slug: 'barcelona',
    cityId: 'barcelona',
    displayName: 'Barcelona',
    wave: 1,
    timeZone: 'Europe/Madrid',
    reviewed: true,
    intro:
      'Barcelona combina arquitectura modernista, playas urbanas y montaña en pocos kilómetros. En pocos días puedes recorrer las obras de Gaudí —la Sagrada Familia, el Parque Güell y la Casa Batlló—, subir a Montjuïc y perderte en el Barrio Gótico. Es una ciudad que se disfruta tanto caminando por el centro como saliendo de excursión a Montserrat o la Costa Brava.',
    bestTime:
      'La primavera (abril a junio) y el otoño (septiembre a octubre) ofrecen clima templado y menos aglomeración que el verano.',
    gettingThere:
      'Desde Santiago hay vuelos con escala y, según la temporada, directos; el vuelo directo dura aprox. 13-14 horas. El aeropuerto El Prat conecta con el centro en metro y tren.',
    tips: [
      'La Sagrada Familia y el Parque Güell suelen agotar entradas con días de anticipación en temporada alta: resérvalas antes de viajar.',
      'El transporte público (metro, bus) cubre casi toda la ciudad; una tarjeta de varios viajes suele salir más a cuenta que boletos sueltos.',
      'La cena es más tarde que en Chile: muchos restaurantes abren recién desde las 20:30.',
      'El Barrio Gótico y La Rambla son zonas de alto movimiento turístico: cuida tus pertenencias, especialmente en el metro.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Barcelona?',
        a: 'Con 3 días recorres lo esencial: la Sagrada Familia, el Parque Güell, el Barrio Gótico y la playa de la Barceloneta. Con 4 o 5 días puedes sumar Montjuïc completo o una excursión a Montserrat.',
      },
      {
        q: '¿Necesito visa para viajar a Barcelona desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a España (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Barcelona en un día?',
        a: 'Las más populares son el Monasterio de Montserrat, Sitges y Girona. Todas quedan a menos de un par de horas en tren o bus.',
      },
    ],
  },
  {
    slug: 'roma',
    cityId: 'rome',
    displayName: 'Roma',
    wave: 1,
    timeZone: 'Europe/Rome',
    reviewed: true,
    intro:
      'Roma concentra más de dos mil años de historia en su centro histórico. En pocos días puedes recorrer el Coliseo y el Foro Romano, cruzar al Vaticano para ver la Basílica de San Pedro y la Capilla Sixtina, y lanzar una moneda a la Fontana di Trevi. Es una ciudad ideal para combinar historia antigua, arte y buena mesa, con excursiones de un día a Pompeya o la campiña romana.',
    bestTime:
      'La primavera (abril a junio) y el otoño (septiembre y octubre) son las épocas más agradables; el verano es muy caluroso y saturado de turistas.',
    gettingThere:
      'Desde Santiago hay vuelos con escala; el aeropuerto Fiumicino conecta con el centro en tren.',
    tips: [
      'Reserva con anticipación el Coliseo, los Museos Vaticanos y la Capilla Sixtina: las entradas de temporada alta se agotan con días de anticipación.',
      'El centro histórico se recorre mejor a pie; muchas calles empedradas no son cómodas en tacones o con equipaje.',
      'La cena es más tarde que en Chile: muchos restaurantes abren recién desde las 19:30-20:00.',
      'El transporte público (metro, bus, tranvía) cubre el centro, pero el metro tiene solo dos líneas principales; camina cuando puedas.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Roma?',
        a: 'Con 3 días recorres lo esencial: el Coliseo, el Foro Romano, el Vaticano y el centro histórico. Con 4 o 5 días puedes sumar Pompeya o Ostia Antica.',
      },
      {
        q: '¿Necesito visa para viajar a Roma desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a Italia (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Roma en un día?',
        a: 'Las más populares son Ostia Antica, Villa Adriana en Tívoli y Pompeya. Pompeya queda más lejos y conviene salir temprano en la mañana.',
      },
    ],
  },
  {
    slug: 'paris',
    cityId: 'paris',
    displayName: 'París',
    wave: 1,
    timeZone: 'Europe/Paris',
    reviewed: true,
    intro:
      'París reúne algunos de los museos y monumentos más reconocidos del mundo en un centro compacto y muy caminable. En pocos días puedes subir a la Torre Eiffel, recorrer el Museo del Louvre, caminar los Campos Elíseos hasta el Arco de Triunfo y visitar la Catedral de Notre-Dame. Es una ciudad que combina historia, arte y vida de barrio, con el Palacio de Versalles como la excursión de un día más popular.',
    bestTime:
      'La primavera (abril a junio) y el otoño (septiembre y octubre) ofrecen clima templado y menos aglomeración que el verano.',
    gettingThere:
      'Desde Santiago hay vuelos con escala y, según la temporada, directos; el vuelo directo dura aprox. 14 horas. Los aeropuertos Charles de Gaulle y Orly conectan con el centro en tren o RER.',
    tips: [
      'Reserva con anticipación la Torre Eiffel y el Louvre: las entradas de temporada alta se agotan con días de anticipación.',
      'El metro cubre casi toda la ciudad y es la forma más rápida de moverse entre barrios.',
      'La cena es más tarde que en Chile: muchos restaurantes abren recién desde las 19:30-20:00.',
      'Muchos museos cierran un día a la semana (frecuentemente lunes o martes): confirma el calendario de cada uno antes de ir.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer París?',
        a: 'Con 3 días recorres lo esencial: la Torre Eiffel, el Louvre, Notre-Dame y los Campos Elíseos. Con 4 o 5 días puedes sumar una excursión a Versalles.',
      },
      {
        q: '¿Necesito visa para viajar a París desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a Francia (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde París en un día?',
        a: 'Las más populares son el Palacio de Versalles, Giverny y el Palacio de Fontainebleau. Todas se pueden hacer en tren desde el centro.',
      },
    ],
  },
  {
    slug: 'buenos-aires',
    cityId: 'buenosaires',
    displayName: 'Buenos Aires',
    wave: 1,
    timeZone: 'America/Argentina/Buenos_Aires',
    reviewed: true,
    intro:
      'Buenos Aires combina arquitectura europea, tango y una intensa vida de café en un centro fácil de recorrer a pie. En pocos días puedes ver la Casa Rosada y la Plaza de Mayo, el Teatro Colón, el Cementerio de la Recoleta y el barrio de San Telmo, además de vivir el ambiente futbolero en La Bombonera. Es una ciudad que se disfruta caminando entre barrios, con Colonia del Sacramento en Uruguay como la excursión de un día más popular.',
    bestTime:
      'El otoño (marzo a mayo) y la primavera (septiembre a noviembre) tienen clima templado; el verano puede ser muy húmedo y caluroso.',
    gettingThere:
      'Desde Santiago hay vuelo directo, aprox. 2 horas.',
    tips: [
      'Camina San Telmo y La Boca de día; son barrios turísticos, pero conviene evitar zonas poco transitadas de noche.',
      'La cena es más tarde que en Chile: muchos restaurantes abren recién desde las 21:00.',
      'El Teatro Colón ofrece visitas guiadas incluso sin función: resérvala con anticipación si te interesa el interior del edificio.',
      'El transporte público (subte, colectivo) cubre gran parte de la ciudad; necesitas una tarjeta SUBE para pagar.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Buenos Aires?',
        a: 'Con 3 días recorres lo esencial: el centro histórico, Recoleta, San Telmo y La Boca. Con 4 o 5 días puedes sumar una excursión a Colonia del Sacramento.',
      },
      {
        q: '¿Necesito visa para viajar a Buenos Aires desde Chile?',
        a: 'Los chilenos pueden ingresar a Argentina con cédula de identidad vigente por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Buenos Aires en un día?',
        a: 'Las más populares son Tigre, Colonia del Sacramento en Uruguay y San Antonio de Areco. Colonia se cruza en ferry desde Puerto Madero.',
      },
    ],
  },
  {
    slug: 'rio-de-janeiro',
    cityId: 'rio',
    displayName: 'Río de Janeiro',
    wave: 1,
    timeZone: 'America/Sao_Paulo',
    reviewed: true,
    intro:
      'Río de Janeiro combina playas urbanas, montaña y selva tropical dentro de los límites de la ciudad. En pocos días puedes subir al Cristo Redentor y al Pan de Azúcar, caminar las playas de Copacabana e Ipanema, y recorrer la Escalera de Selarón. Es una ciudad para combinar naturaleza y vida de playa, con Petrópolis y Paraty como las excursiones de un día más populares.',
    bestTime:
      'El otoño (abril a junio) y la primavera (septiembre a noviembre) tienen clima agradable con menos calor y lluvia que el verano.',
    gettingThere:
      'Desde Santiago hay vuelo directo o con escala, aprox. 4-5 horas.',
    tips: [
      'Compra las entradas al Cristo Redentor y al Pan de Azúcar con anticipación: en temporada alta los horarios más solicitados se agotan.',
      'Lleva solo lo necesario a la playa; evita mostrar objetos de valor en Copacabana e Ipanema.',
      'El transporte público (metro) cubre el centro y la zona sur; para Santa Teresa y otros cerros conviene usar taxi o app.',
      'La ciudad tiene un clima muy húmedo: revisa el pronóstico antes de planificar el Cristo Redentor, ya que la niebla puede tapar la vista.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Río de Janeiro?',
        a: 'Con 3 días recorres lo esencial: el Cristo Redentor, el Pan de Azúcar y las playas de Copacabana e Ipanema. Con 4 o 5 días puedes sumar una excursión a Petrópolis o Paraty.',
      },
      {
        q: '¿Necesito visa para viajar a Río de Janeiro desde Chile?',
        a: 'Los chilenos pueden ingresar a Brasil con cédula de identidad por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Río de Janeiro en un día?',
        a: 'Las más populares son Petrópolis, Paraty e Ilha Grande. Petrópolis es la más cercana y se puede hacer en medio día.',
      },
    ],
  },
  {
    slug: 'lima',
    cityId: 'lima',
    displayName: 'Lima',
    wave: 1,
    timeZone: 'America/Lima',
    reviewed: true,
    intro:
      'Lima combina un centro histórico colonial, barrios costeros modernos y una de las mejores escenas gastronómicas de Sudamérica. En pocos días puedes recorrer la Plaza Mayor y la Catedral de Lima, caminar el malecón de Miraflores y explorar el barrio bohemio de Barranco, además de visitar la huaca prehispánica de Huaca Pucllana en plena ciudad. Es una ciudad ideal para combinar historia, arquitectura y comida, con el santuario arqueológico de Pachacámac como la excursión de un día más cercana.',
    bestTime:
      'De diciembre a abril el clima es más soleado y cálido; entre junio y septiembre Lima suele estar nublada (la "garúa" limeña).',
    gettingThere:
      'Desde Santiago hay vuelo directo, aprox. 3,5 horas.',
    tips: [
      'Reserva con anticipación en los restaurantes más conocidos de Barranco y Miraflores: suelen tener lista de espera en horario de cena.',
      'El malecón de Miraflores es ideal para caminar o correr, especialmente al atardecer.',
      'El transporte público formal es limitado; la mayoría de los visitantes usa aplicaciones de transporte para moverse entre distritos.',
      'Huaca Pucllana y el centro histórico se visitan mejor con guía, ya que el contexto histórico no siempre está señalizado.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Lima?',
        a: 'Con 2 o 3 días recorres lo esencial: el centro histórico, Miraflores y Barranco. Si sumas una excursión a Pachacámac, conviene un día adicional.',
      },
      {
        q: '¿Necesito visa para viajar a Lima desde Chile?',
        a: 'Los chilenos pueden ingresar a Perú con cédula de identidad por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursión puedo hacer desde Lima en un día?',
        a: 'La más cercana es el santuario arqueológico de Pachacámac, a menos de una hora del centro de la ciudad.',
      },
    ],
  },
  {
    slug: 'cusco',
    cityId: 'cusco',
    displayName: 'Cusco',
    wave: 1,
    timeZone: 'America/Lima',
    reviewed: true,
    intro:
      'Cusco fue la capital del imperio inca y es hoy la puerta de entrada a Machu Picchu y al Valle Sagrado. En la propia ciudad puedes recorrer la Plaza de Armas, la Catedral y el Coricancha, además de la fortaleza de Sacsayhuamán a pocos minutos del centro. Es una ciudad pensada para quedarte varios días y salir de excursión: Machu Picchu, el Valle Sagrado y la Montaña de Siete Colores son los imperdibles de la región.',
    bestTime:
      'La temporada seca (abril a octubre) tiene mejor clima para caminar y visitar sitios arqueológicos; de noviembre a marzo llueve con más frecuencia.',
    gettingThere:
      'Desde Santiago se vuela a Lima (aprox. 3,5 h) y se conecta a Cusco; la ciudad está a más de 3.000 m de altura — dedica el primer día a aclimatarte antes de actividades exigentes.',
    tips: [
      'Dedica tu primer día en Cusco a caminar despacio y tomar líquido: el soroche (mal de altura) es común al llegar desde el nivel del mar.',
      'Reserva la entrada a Machu Picchu (y el tren, si vas por cuenta propia) con semanas de anticipación: el cupo diario es limitado.',
      'El boleto turístico general de Cusco cubre varios sitios arqueológicos de la ciudad y el Valle Sagrado: revisa si te conviene antes de comprar entradas sueltas.',
      'Lleva ropa por capas: las mañanas y noches son frías incluso en temporada seca.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Cusco?',
        a: 'Con 2 días recorres la ciudad y Sacsayhuamán. Para sumar Machu Picchu y el Valle Sagrado conviene planificar 4 o 5 días en total.',
      },
      {
        q: '¿Necesito visa para viajar a Cusco desde Chile?',
        a: 'Los chilenos pueden ingresar a Perú con cédula de identidad por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Cusco?',
        a: 'Las más populares son Machu Picchu, el Valle Sagrado de los Incas, Ollantaytambo y Moray. La Montaña de Siete Colores (Vinicunca) es una excursión más exigente por la altura.',
      },
    ],
  },
  {
    slug: 'mendoza',
    cityId: 'mendoza',
    displayName: 'Mendoza',
    wave: 1,
    timeZone: 'America/Argentina/Mendoza',
    reviewed: true,
    intro:
      'Mendoza es la puerta de entrada a la cordillera de los Andes y a una de las regiones vitivinícolas más importantes de Sudamérica. En la ciudad puedes recorrer el Parque General San Martín y el Cerro de la Gloria, pero el verdadero atractivo está en las excursiones: las bodegas del Valle de Uco, el camino de montaña hacia el Puente del Inca y el paso Cristo Redentor. Es un destino pensado para combinar unos días de ciudad con salidas de un día a la montaña o a las viñas.',
    bestTime:
      'El otoño (marzo a mayo, época de vendimia) y la primavera (septiembre a noviembre) son las estaciones más agradables; el verano es seco y caluroso.',
    gettingThere:
      'Desde Santiago hay vuelo directo corto (aprox. 1 hora) o cruce terrestre por el Paso Cristo Redentor, sujeto a cierres por clima en invierno.',
    tips: [
      'Si vas a recorrer bodegas, contrata un tour o designa un conductor: las distancias entre bodegas son mayores de lo que parecen en el mapa.',
      'El paso terrestre a Chile puede cerrarse por nieve en invierno: si cruzas por tierra, confirma el estado del paso antes de viajar.',
      'El centro se recorre bien a pie o en bici; el Parque General San Martín es uno de los más grandes de Argentina.',
      'Lleva ropa de abrigo si vas a la alta montaña (Puente del Inca, Uspallata), aunque en la ciudad haga calor.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Mendoza?',
        a: 'Con 2 días recorres la ciudad y una bodega. Con 3 o 4 días puedes sumar una excursión de montaña hasta el Puente del Inca o el Cristo Redentor de los Andes.',
      },
      {
        q: '¿Necesito visa para viajar a Mendoza desde Chile?',
        a: 'Los chilenos pueden ingresar a Argentina con cédula de identidad vigente por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Mendoza en un día?',
        a: 'Las más populares son el Valle de Uco (ruta del vino), Uspallata y el Puente del Inca. Todas se recorren mejor en auto o con un tour organizado.',
      },
    ],
  },
  {
    slug: 'bariloche',
    cityId: 'bariloche',
    displayName: 'Bariloche',
    wave: 1,
    timeZone: 'America/Argentina/Buenos_Aires',
    reviewed: true,
    intro:
      'Bariloche es la puerta de entrada a la Patagonia andina, con el lago Nahuel Huapi y el parque nacional del mismo nombre como base para varios días de excursiones. Desde la ciudad puedes recorrer el Cerro Catedral y el histórico Hotel Llao Llao, y salir de excursión al Cerro Tronador o al Camino de los Siete Lagos. Es un destino para combinar montaña, lagos y chocolate, con pueblos cercanos como El Bolsón y Villa La Angostura como paradas de un día.',
    bestTime:
      'El verano (diciembre a marzo) es la mejor época para trekking y lagos; el invierno (junio a septiembre) atrae por el esquí en el Cerro Catedral.',
    gettingThere:
      'Desde Santiago se llega con conexión aérea, o por tierra desde el sur de Chile cruzando el Paso Cardenal Samoré, sujeto a cierres por clima en invierno.',
    tips: [
      'Reserva con anticipación en temporada alta (verano y vacaciones de invierno): el alojamiento y los tours se agotan rápido.',
      'El centro cívico y la costanera se recorren a pie; para los cerros y circuitos más lejanos conviene auto o excursión organizada.',
      'Prueba el chocolate artesanal: es una de las tradiciones más conocidas de la ciudad.',
      'Si cruzas por tierra desde Chile, confirma el estado del Paso Cardenal Samoré antes de viajar, ya que puede cerrarse por nieve.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Bariloche?',
        a: 'Con 3 días recorres la ciudad, el Cerro Catedral y el circuito del lago Nahuel Huapi. Con 4 o 5 días puedes sumar El Bolsón o Villa La Angostura.',
      },
      {
        q: '¿Necesito visa para viajar a Bariloche desde Chile?',
        a: 'Los chilenos pueden ingresar a Argentina con cédula de identidad vigente por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Bariloche en un día?',
        a: 'Las más populares son Villa La Angostura, el Camino de los Siete Lagos y El Bolsón. El Cerro Tronador es una excursión más larga hacia el parque nacional.',
      },
    ],
  },
  {
    slug: 'miami',
    cityId: 'miami',
    displayName: 'Miami',
    wave: 2,
    timeZone: 'America/New_York',
    reviewed: true,
    intro:
      'Miami combina playa, cultura latina y arte urbano en una sola ciudad. Puedes recorrer South Beach y los edificios art déco de Ocean Drive, la Pequeña Habana, los jardines de Villa Vizcaya y los murales de Wynwood. Es un destino para mezclar playa, compras y gastronomía, con el Parque nacional de los Everglades a poca distancia.',
    bestTime:
      'De diciembre a abril el clima es más seco y templado; el verano es caluroso y húmedo, y la temporada de huracanes del Atlántico va de junio a noviembre.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 8 a 9 horas. Del Aeropuerto Internacional de Miami al centro y a Miami Beach se llega en tren, bus o taxi.',
    tips: [
      'Tramita la autorización electrónica ESTA con anticipación, antes de comprar tus pasajes.',
      'Las distancias son largas: para moverte entre Miami Beach, el centro y los barrios conviene auto o aplicaciones de transporte.',
      'En Estados Unidos la propina no viene incluida en muchos restaurantes; revisa la cuenta antes de pagar.',
      'Usa protector solar y toma agua: el sol es intenso casi todo el año.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Miami?',
        a: 'Con 3 o 4 días recorres South Beach, la Pequeña Habana, Wynwood y Villa Vizcaya. Con 5 días o más puedes sumar los Everglades o un viaje a Cayo Hueso.',
      },
      {
        q: '¿Necesito visa para viajar a Miami desde Chile?',
        a: 'Los chilenos no necesitan visa por estadías turísticas cortas, pero sí la autorización electrónica ESTA aprobada antes de viajar. Confirma los requisitos vigentes antes de comprar tus pasajes.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Miami en un día?',
        a: 'Las más populares son el Parque nacional de los Everglades y Fort Lauderdale. Saliendo temprano también puedes llegar a Cayo Hueso, en el extremo sur de los cayos de Florida.',
      },
    ],
  },
  {
    slug: 'nueva-york',
    cityId: 'newyork',
    displayName: 'Nueva York',
    wave: 2,
    timeZone: 'America/New_York',
    reviewed: true,
    intro:
      'Nueva York reúne en pocos kilómetros algunos de los íconos urbanos más reconocibles: la Estatua de la Libertad, el Empire State Building, Times Square, Central Park y el Puente de Brooklyn. Suma museos como el Museo Metropolitano de Arte y barrios con identidad propia como Greenwich Village y Harlem. Es una ciudad para caminar mucho y combinar cultura, arquitectura y gastronomía.',
    bestTime:
      'Primavera (abril a junio) y otoño (septiembre a noviembre) tienen temperaturas agradables para caminar; el verano es caluroso y húmedo, y el invierno es frío, con posibilidad de nieve.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 10 a 11 horas, además de opciones con escala. Desde el aeropuerto JFK se llega a Manhattan en tren (AirTrain y metro), bus o taxi.',
    tips: [
      'Tramita la autorización electrónica ESTA con anticipación, antes de comprar tus pasajes.',
      'El metro conecta casi todos los barrios y es la forma más práctica de moverse; entre puntos cercanos de Manhattan también se camina bien.',
      'Reserva con anticipación los miradores y la visita a la Estatua de la Libertad en temporada alta.',
      'La propina no viene incluida en la mayoría de los restaurantes; revisa la cuenta antes de pagar.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Nueva York?',
        a: 'Con 4 o 5 días recorres lo esencial: Times Square, Central Park, el Empire State Building, el Museo Metropolitano de Arte y la Estatua de la Libertad. Con más días puedes cruzar el Puente de Brooklyn a pie y sumar barrios como Harlem.',
      },
      {
        q: '¿Necesito visa para viajar a Nueva York desde Chile?',
        a: 'Los chilenos no necesitan visa por estadías turísticas cortas, pero sí la autorización electrónica ESTA aprobada antes de viajar. Confirma los requisitos vigentes antes de comprar tus pasajes.',
      },
      {
        q: '¿Cómo me muevo por Nueva York?',
        a: 'El metro y los buses llegan a casi todos los barrios y son la opción más práctica. En Manhattan muchas distancias se recorren a pie, y desde el sur de la isla salen los ferris hacia la Estatua de la Libertad.',
      },
    ],
  },
  {
    slug: 'ciudad-de-mexico',
    cityId: 'mexicocity',
    displayName: 'Ciudad de México',
    wave: 2,
    timeZone: 'America/Mexico_City',
    reviewed: true,
    intro:
      'La Ciudad de México mezcla ruinas mexicas, arquitectura colonial y una gran oferta de museos. En el centro histórico están el Templo Mayor, la Plaza de la Constitución (el Zócalo) y el Palacio de Bellas Artes; en Chapultepec, el Museo Nacional de Antropología y el Castillo de Chapultepec. Es un destino para varios días de cultura y gastronomía, con Teotihuacán como excursión clásica.',
    bestTime:
      'De marzo a mayo el clima es seco y templado; de junio a septiembre es temporada de lluvias, con chubascos casi siempre por la tarde. La ciudad está a más de 2.200 metros de altura, así que las noches son frescas todo el año.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 9 horas. Del aeropuerto internacional de la Ciudad de México al centro se llega en metro, Metrobús o taxi autorizado.',
    tips: [
      'Tómate el primer día con calma: la altura puede cansarte más de lo normal.',
      'El metro y el Metrobús cubren gran parte de la ciudad; para trayectos de noche o con equipaje usa aplicaciones de transporte.',
      'Muchos museos cierran un día a la semana: revisa el sitio oficial de cada uno antes de ir.',
      'Para Teotihuacán sal temprano: el sitio es amplio y tiene poca sombra.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Ciudad de México?',
        a: 'Con 4 días recorres el centro histórico, Chapultepec, Coyoacán y Xochimilco. Con 5 días o más puedes sumar Teotihuacán y otra excursión.',
      },
      {
        q: '¿Necesito visa para viajar a Ciudad de México desde Chile?',
        a: 'Los chilenos pueden ingresar a México sin visa por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Ciudad de México en un día?',
        a: 'La más popular es Teotihuacán, a aprox. una hora de la ciudad. Otra opción es la zona arqueológica de Xochicalco, más lejos, en el estado de Morelos.',
      },
    ],
  },
  {
    slug: 'tokio',
    cityId: 'tokyo',
    displayName: 'Tokio',
    wave: 2,
    timeZone: 'Asia/Tokyo',
    reviewed: true,
    intro:
      'Tokio combina templos y santuarios tradicionales con barrios de neón y tecnología. En pocos días puedes visitar el templo Sensō-ji, el Santuario Meiji, el cruce de Shibuya y la torre Tokyo Skytree. Es una ciudad muy extensa y bien conectada en tren, que se presta para combinar con excursiones a Kamakura, Hakone o el Monte Fuji.',
    bestTime:
      'Primavera (marzo a mayo), con la floración de los cerezos, y otoño (octubre y noviembre) son las épocas más agradables; el verano es caluroso y húmedo, y el invierno es frío pero mayormente seco.',
    gettingThere:
      'Desde Santiago no hay vuelos directos: se llega con una o más escalas. Desde los aeropuertos de Narita y Haneda se llega al centro en tren.',
    tips: [
      'Usa una tarjeta de transporte recargable (como Suica o Pasmo) para trenes, metro y buses sin comprar boletos cada vez.',
      'Lleva algo de efectivo: algunos templos, restaurantes pequeños y tiendas no aceptan tarjeta.',
      'Si vas a hacer varias excursiones en tren de alta velocidad, compara el Japan Rail Pass con los boletos sueltos antes de comprarlo.',
      'En Japón no se acostumbra dejar propina.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Tokio?',
        a: 'Con 4 o 5 días recorres los barrios principales: Asakusa, Shibuya, Shinjuku, Harajuku y Akihabara. Con una semana puedes sumar excursiones a Kamakura, Nikkō o Hakone.',
      },
      {
        q: '¿Necesito visa para viajar a Tokio desde Chile?',
        a: 'Los chilenos pueden ingresar a Japón sin visa por estadías turísticas cortas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Tokio en un día?',
        a: 'Las más populares son Kamakura, Nikkō, Hakone y la zona del Monte Fuji. Todas se pueden hacer en tren en el día, saliendo temprano.',
      },
    ],
  },
  {
    slug: 'singapur',
    cityId: 'singapore',
    displayName: 'Singapur',
    wave: 2,
    timeZone: 'Asia/Singapore',
    reviewed: true,
    intro:
      'Singapur es una ciudad-estado compacta donde conviven las culturas china, malaya e india. Puedes recorrer Marina Bay Sands y los Jardines de la Bahía, el Jardín Botánico de Singapur, el Merlión junto a la bahía y la isla de Sentosa. Es un buen destino para una escala larga o para combinar con otros países del sudeste asiático, y para comer en centros de comida como Lau Pa Sat.',
    bestTime:
      'Hace calor y humedad todo el año, con lluvias frecuentes; de febrero a abril suele llover algo menos, y de noviembre a enero es la época más lluviosa.',
    gettingThere:
      'Desde Santiago no hay vuelos directos: se llega con una o más escalas. Del aeropuerto de Changi al centro se llega en metro (MRT), bus o taxi.',
    tips: [
      'El metro (MRT) y los buses cubren casi toda la ciudad, y puedes pagarlos con una tarjeta bancaria sin contacto.',
      'Prueba los centros de comida (hawker centres), como Lau Pa Sat: son la forma más local de comer.',
      'Lleva ropa liviana, paraguas y algo de abrigo para interiores, donde el aire acondicionado suele ser intenso.',
      'Las normas son estrictas: por ejemplo, está prohibido comer y beber en el metro.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Singapur?',
        a: 'Con 3 días recorres Marina Bay, los Jardines de la Bahía, el Jardín Botánico y la Pequeña India. Con 4 o 5 días puedes sumar Sentosa y el Zoológico de Singapur.',
      },
      {
        q: '¿Necesito visa para viajar a Singapur desde Chile?',
        a: 'Los chilenos pueden ingresar a Singapur sin visa por estadías turísticas cortas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Cómo me muevo por Singapur?',
        a: 'El metro (MRT) y los buses llegan a casi todos los puntos de interés, incluido el aeropuerto de Changi. Para llegar a Sentosa puedes usar el monorriel, el teleférico o cruzar caminando desde HarbourFront.',
      },
    ],
  },
  {
    slug: 'sidney',
    cityId: 'sydney',
    displayName: 'Sídney',
    wave: 2,
    timeZone: 'Australia/Sydney',
    reviewed: true,
    intro:
      'Sídney se organiza alrededor de su bahía, con la Ópera de Sídney y el Puente de la bahía como postales más reconocidas. En pocos días puedes recorrer el barrio histórico de The Rocks, Darling Harbour, el Zoológico Taronga y playas urbanas como Bondi Beach o la Playa de Manly. Es un destino para combinar ciudad, playa y naturaleza, con las Montañas Azules como excursión clásica.',
    bestTime:
      'Las estaciones coinciden con las de Chile: primavera (septiembre a noviembre) y otoño (marzo a mayo) son templadas y agradables, el verano (diciembre a febrero) es la temporada de playa y el invierno es suave.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 14 a 15 horas, y también opciones con escala en Auckland. Del aeropuerto de Sídney al centro se llega en tren o taxi.',
    tips: [
      'Tramita la visa de turista en línea con anticipación, antes de comprar tus pasajes.',
      'Usa los ferris para moverte por la bahía: salen desde Circular Quay hacia Manly, Taronga y otros puntos.',
      'En la playa báñate solo entre las banderas rojas y amarillas, que marcan la zona vigilada por salvavidas.',
      'Puedes pagar trenes, buses y ferris con tarjeta bancaria sin contacto o con la tarjeta Opal.',
      'El sol es fuerte: usa protector solar, sombrero y lentes incluso en días nublados.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Sídney?',
        a: 'Con 4 días recorres la Ópera, el Puente de la bahía, The Rocks, Darling Harbour y Bondi Beach. Con 5 o 6 días puedes sumar una excursión a las Montañas Azules o al Valle de Hunter.',
      },
      {
        q: '¿Necesito visa para viajar a Sídney desde Chile?',
        a: 'Los chilenos necesitan una visa de turista para Australia, que se tramita en línea antes del viaje. Confirma los requisitos vigentes antes de comprar tus pasajes.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Sídney en un día?',
        a: 'La más popular es la de las Montañas Azules. También puedes visitar el Parque nacional Real, el Valle de Hunter, conocido por sus viñedos, o la costa de Palm Beach, al norte de la ciudad.',
      },
    ],
  },
  {
    slug: 'auckland',
    cityId: 'auckland',
    displayName: 'Auckland',
    wave: 2,
    timeZone: 'Pacific/Auckland',
    reviewed: true,
    intro:
      'Auckland es la ciudad más grande de Nueva Zelanda y está rodeada de bahías, islas y conos volcánicos. Puedes subir a la Sky Tower, visitar el Museo Conmemorativo de Guerra de Auckland, recorrer Viaduct Harbour, subir al Monte Eden o tomar un ferry a Devonport y a la isla Rangitoto. Es una buena base para conocer la Isla Norte, con excursiones a la Isla Waiheke, la Playa Piha o las Cuevas de Waitomo.',
    bestTime:
      'Las estaciones coinciden con las de Chile: el verano (diciembre a febrero) es la mejor época para playas e islas, y la primavera y el otoño son templados; el clima es cambiante y puede llover en cualquier época del año.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 12 a 13 horas. Del aeropuerto de Auckland al centro se llega en bus o taxi.',
    tips: [
      'Tramita la autorización electrónica NZeTA antes de viajar.',
      'Usa los ferris que salen de la Terminal de Ferry del centro para llegar a Devonport, Rangitoto y la Isla Waiheke.',
      'Lleva siempre una capa impermeable: el clima puede cambiar varias veces en el mismo día.',
      'Nueva Zelanda tiene controles de bioseguridad estrictos: declara alimentos, plantas y equipo de camping al llegar.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Auckland?',
        a: 'Con 3 días recorres el centro, el Museo Conmemorativo de Guerra de Auckland, el Monte Eden y Devonport. Con 4 o 5 días puedes sumar la Isla Waiheke y una excursión a la costa oeste.',
      },
      {
        q: '¿Necesito visa para viajar a Auckland desde Chile?',
        a: 'Los chilenos no necesitan visa por estadías turísticas cortas, pero sí la autorización electrónica NZeTA antes de viajar. Confirma los requisitos vigentes antes de comprar tus pasajes.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Auckland en un día?',
        a: 'Las más populares son la Isla Waiheke, en ferry, y las playas de arena negra de Piha y Muriwai. En excursiones de día completo puedes llegar a las Cuevas de Waitomo, Hobbiton o Rotorua.',
      },
    ],
  },
  {
    slug: 'londres',
    cityId: 'london',
    displayName: 'Londres',
    wave: 3,
    timeZone: 'Europe/London',
    reviewed: true,
    intro:
      'Londres mezcla siglos de historia con barrios llenos de vida y una oferta enorme de museos, muchos de ellos gratuitos. En pocos días puedes recorrer la Torre de Londres, la Abadía de Westminster y el Palacio de Buckingham, pasar una tarde en el Museo Británico y cruzar el Puente de la Torre.',
    bestTime:
      'De mayo a septiembre los días son largos y más templados; la primavera y el otoño son agradables y con menos gente, y el invierno es frío, húmedo y de días cortos.',
    gettingThere:
      'Desde Santiago hay vuelos con escala; la oferta de vuelos directos cambia según la temporada, así que revísala al reservar. Desde Heathrow al centro se llega en metro o en tren.',
    tips: [
      'Paga el transporte público con tarjeta sin contacto o con la tarjeta Oyster: el sistema aplica un tope diario.',
      'Muchos museos nacionales, como el Museo Británico y la National Gallery, tienen entrada general gratuita; algunas exposiciones temporales se pagan aparte.',
      'Lleva siempre un paraguas o una chaqueta impermeable: la lluvia puede aparecer en cualquier época del año.',
      'Los enchufes son de tipo G, distintos a los de Chile: lleva un adaptador.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Londres?',
        a: 'Con 4 días recorres lo esencial: Westminster, la Torre de Londres, el Museo Británico y un par de barrios como Soho o Notting Hill. Con 5 o 6 días puedes sumar una excursión a Windsor u Oxford.',
      },
      {
        q: '¿Necesito visa para viajar a Londres desde Chile?',
        a: 'Los chilenos no necesitan visa por estadías turísticas cortas, pero sí la autorización electrónica ETA del Reino Unido aprobada antes de viajar. Confirma los requisitos vigentes antes de comprar tus pasajes.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Londres en un día?',
        a: 'Las más populares son el Castillo de Windsor, Oxford, Stonehenge y la Catedral de Canterbury. Todas se pueden hacer en tren, bus o tour organizado.',
      },
    ],
  },
  {
    slug: 'florencia',
    cityId: 'florence',
    displayName: 'Florencia',
    wave: 3,
    timeZone: 'Europe/Rome',
    reviewed: true,
    intro:
      'Florencia fue la cuna del Renacimiento y concentra en pocas cuadras algunas de las obras de arte más famosas del mundo. Puedes subir a la cúpula de la Catedral de Santa María del Fiore, ver el David en la Galería de la Academia, recorrer la Galería Uffizi y cruzar el Ponte Vecchio al atardecer.',
    bestTime:
      'Primavera (abril a junio) y otoño (septiembre y octubre) son las mejores épocas; el verano es caluroso y muy concurrido, y el invierno es fresco y más tranquilo.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Madrid o Roma. Desde Roma o Milán también se llega en tren de alta velocidad.',
    tips: [
      'Reserva con anticipación la Galería Uffizi y la Galería de la Academia: en temporada alta las filas son largas.',
      'El centro histórico se recorre a pie; gran parte tiene acceso restringido para autos.',
      'Sube al Piazzale Michelangelo al atardecer para tener una de las mejores vistas de la ciudad.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Florencia?',
        a: 'Con 3 días recorres los museos principales, la catedral, el Palacio Pitti y el Ponte Vecchio. Con 4 o 5 días puedes sumar excursiones por la Toscana.',
      },
      {
        q: '¿Necesito visa para viajar a Florencia desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a Italia (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Florencia en un día?',
        a: 'Las más populares son Siena, San Gimignano, Lucca, la Plaza de los Milagros en Pisa y los viñedos del Chianti. Se puede llegar en tren, bus o tour organizado.',
      },
    ],
  },
  {
    slug: 'berlin',
    cityId: 'berlin',
    displayName: 'Berlín',
    wave: 3,
    timeZone: 'Europe/Berlin',
    reviewed: true,
    intro:
      'Berlín es una capital marcada por la historia del siglo XX y hoy es una de las ciudades más creativas de Europa. Puedes pasar por la Puerta de Brandeburgo y el Edificio del Reichstag, recorrer los restos del Muro de Berlín en la East Side Gallery y dedicar un día a la Isla de los Museos.',
    bestTime:
      'De mayo a septiembre el clima es templado y la ciudad vive al aire libre; el invierno es frío, pero en diciembre hay mercados navideños.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Madrid, Fráncfort o São Paulo. Desde el aeropuerto BER al centro se llega en tren.',
    tips: [
      'Para visitar la cúpula del Edificio del Reichstag hay que inscribirse con anticipación en el sitio oficial.',
      'El transporte público (metro, tren y tranvía) cubre toda la ciudad; elige el pase según las zonas que vas a usar.',
      'Muchos memoriales, como el Monumento a los judíos de Europa asesinados y el Memorial del Muro de Berlín, son de acceso libre.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Berlín?',
        a: 'Con 3 días ves los sitios históricos del centro, el Muro y la Isla de los Museos. Con 4 o 5 días puedes sumar barrios como Kreuzberg y una excursión a Potsdam.',
      },
      {
        q: '¿Necesito visa para viajar a Berlín desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a Alemania (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Berlín en un día?',
        a: 'Las más populares son Potsdam, con el Palacio de Sanssouci y sus jardines, y el memorial del Campo de concentración de Sachsenhausen. Ambos se pueden hacer en tren regional.',
      },
    ],
  },
  {
    slug: 'lisboa',
    cityId: 'lisbon',
    displayName: 'Lisboa',
    wave: 3,
    timeZone: 'Europe/Lisbon',
    reviewed: true,
    intro:
      'Lisboa se recorre subiendo y bajando colinas, entre tranvías, miradores y fachadas de azulejos. Puedes perderte en el barrio de Alfama, subir al Castillo de San Jorge y pasar un día en Belém, donde están la Torre de Belém y el Monasterio de los Jerónimos.',
    bestTime:
      'Primavera (marzo a junio) y otoño (septiembre y octubre) son las épocas más agradables; el verano es caluroso y concurrido, y el invierno es templado pero más lluvioso.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Madrid o São Paulo. Del aeropuerto al centro se llega en metro, bus o taxi.',
    tips: [
      'Lleva zapatos cómodos: las calles tienen pendientes fuertes y adoquines resbaladizos.',
      'Los tranvías históricos se llenan; sube temprano o combínalos con el metro.',
      'En Belém llega temprano: el Monasterio de los Jerónimos y la Torre de Belém tienen filas largas en temporada alta.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Lisboa?',
        a: 'Con 3 días recorres Alfama, el centro, el Chiado y Belém. Con 4 o 5 días puedes sumar Sintra y la costa de Cascais.',
      },
      {
        q: '¿Necesito visa para viajar a Lisboa desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a Portugal (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Lisboa en un día?',
        a: 'La más popular es Sintra, con el Palacio da Pena; también puedes ir a Cascais, al Cabo de la Roca u Óbidos. Sintra y Cascais tienen tren desde Lisboa.',
      },
    ],
  },
  {
    slug: 'sevilla',
    cityId: 'seville',
    displayName: 'Sevilla',
    wave: 3,
    timeZone: 'Europe/Madrid',
    reviewed: true,
    intro:
      'Sevilla es la capital de Andalucía y una de las ciudades con más patrimonio de España. Puedes visitar la Catedral de Sevilla y subir a la Giralda, recorrer el Real Alcázar, pasear por la Plaza de España y perderte en las callejuelas del barrio de Santa Cruz.',
    bestTime:
      'Primavera (marzo a mayo) y otoño (octubre y noviembre) son las mejores épocas; en julio y agosto el calor es extremo.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, normalmente vía Madrid. Desde Madrid también se llega en tren de alta velocidad (AVE) en aprox. 2,5 horas.',
    tips: [
      'Reserva con anticipación las entradas al Real Alcázar y a la Catedral de Sevilla.',
      'En verano organiza las visitas temprano en la mañana o al final de la tarde, cuando baja el calor.',
      'Cruza el río hasta Triana para ver otra cara de la ciudad.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Sevilla?',
        a: 'Con 2 o 3 días recorres la catedral, el Real Alcázar, la Plaza de España, Santa Cruz y Triana. Con 4 días puedes sumar una excursión a Córdoba o Carmona.',
      },
      {
        q: '¿Necesito visa para viajar a Sevilla desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a España (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Sevilla en un día?',
        a: 'Las más populares son Córdoba, para ver la Mezquita-catedral, el pueblo de Carmona y las ruinas romanas de Itálica, muy cerca de la ciudad. Córdoba tiene conexión en tren de alta velocidad.',
      },
    ],
  },
  {
    slug: 'amsterdam',
    cityId: 'amsterdam',
    displayName: 'Ámsterdam',
    wave: 3,
    timeZone: 'Europe/Amsterdam',
    reviewed: true,
    intro:
      'Ámsterdam es una ciudad de canales, bicicletas y casas angostas, con museos de primer nivel a pocas cuadras unos de otros. Puedes ver a Rembrandt en el Rijksmuseum, visitar el Museo Van Gogh y la Casa de Ana Frank, y recorrer los Canales de Ámsterdam a pie o en barco.',
    bestTime:
      'De abril a septiembre los días son largos y templados; en primavera florecen los tulipanes en Keukenhof. El invierno es frío y húmedo.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Madrid, París o São Paulo. Desde el aeropuerto de Schiphol al centro se llega en tren.',
    tips: [
      'Compra con anticipación las entradas a la Casa de Ana Frank y al Museo Van Gogh: se venden por horario y suelen agotarse.',
      'Cuidado con las ciclovías: son muy transitadas y no se debe caminar por ellas.',
      'Pasea por el Vondelpark y el barrio Jordaan para ver la ciudad más tranquila.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Ámsterdam?',
        a: 'Con 3 días recorres los museos principales, los canales y barrios como Jordaan. Con 4 o 5 días puedes sumar Zaanse Schans, Volendam o Haarlem.',
      },
      {
        q: '¿Necesito visa para viajar a Ámsterdam desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a los Países Bajos (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Ámsterdam en un día?',
        a: 'Las más populares son los molinos de Zaanse Schans, Volendam, Haarlem y Utrecht; en primavera, el parque de flores de Keukenhof. Los molinos de Kinderdijk quedan más lejos y conviene ir con tour.',
      },
    ],
  },
  {
    slug: 'venecia',
    cityId: 'venice',
    displayName: 'Venecia',
    wave: 3,
    timeZone: 'Europe/Rome',
    reviewed: true,
    intro:
      'Venecia está construida sobre una laguna y se recorre a pie o en barco, sin autos. Puedes visitar la Basílica de San Marcos y el Palacio Ducal, cruzar el Puente de Rialto sobre el Gran Canal y tomar un vaporetto a las islas de Murano y Burano.',
    bestTime:
      'Primavera (abril a junio) y otoño (septiembre y octubre) son las mejores épocas; el verano es caluroso y muy concurrido, y en otoño e invierno puede haber marea alta (acqua alta).',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Madrid o Roma. Desde Florencia o Milán también se llega en tren hasta la estación de Santa Lucía, ya dentro de la ciudad.',
    tips: [
      'Sal temprano o al final del día: en las horas centrales la Plaza de San Marcos y el Puente de Rialto están llenos.',
      'Compra un pase de vaporetto si vas a moverte mucho en barco o a visitar las islas.',
      'Revisa si en tu fecha se cobra la tasa de acceso para visitantes por el día y regístrate antes de llegar.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Venecia?',
        a: 'Con 2 días recorres San Marcos, Rialto y los barrios principales. Con 3 días puedes sumar Murano, Burano y Torcello.',
      },
      {
        q: '¿Necesito visa para viajar a Venecia desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a Italia (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Venecia en un día?',
        a: 'Además de las islas de la laguna, en tren puedes ir a Padua o Verona; Aquilea, con sus ruinas romanas, queda más lejos.',
      },
    ],
  },
  {
    slug: 'sao-paulo',
    cityId: 'saopaulo',
    displayName: 'São Paulo',
    wave: 3,
    timeZone: 'America/Sao_Paulo',
    reviewed: true,
    intro:
      'São Paulo es la ciudad más grande de Sudamérica y un centro de arte, gastronomía y vida cultural. Puedes recorrer la Avenida Paulista y el Museo de Arte de São Paulo, pasar una tarde en el Parque do Ibirapuera, visitar la Catedral metropolitana de São Paulo y comer en el barrio de Liberdade.',
    bestTime:
      'Las estaciones coinciden con las de Chile: otoño (abril a junio) y primavera (septiembre a noviembre) son las épocas más agradables; el verano es caluroso y con lluvias por la tarde.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 4 horas. Del aeropuerto de Guarulhos al centro se llega en tren, bus o taxi.',
    tips: [
      'Es una ciudad enorme: agrupa las visitas por barrio y usa el metro para las distancias largas.',
      'El Mercado Municipal de São Paulo es una buena parada para almorzar en el centro.',
      'Ten cuidado con tus pertenencias en zonas concurridas, sobre todo de noche.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer São Paulo?',
        a: 'Con 3 días recorres la Avenida Paulista, el centro histórico, el Parque do Ibirapuera y Liberdade. Con 4 o 5 días puedes sumar más museos y barrios como Vila Madalena.',
      },
      {
        q: '¿Necesito visa para viajar a São Paulo desde Chile?',
        a: 'Los chilenos pueden ingresar a Brasil con cédula de identidad por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Cuál es el mejor barrio para alojarse en São Paulo?',
        a: 'Para una primera visita, la zona de la Avenida Paulista es práctica: tiene metro, museos y restaurantes cerca. Vila Madalena es una buena opción si buscas vida nocturna.',
      },
    ],
  },
  {
    slug: 'bogota',
    cityId: 'bogota',
    displayName: 'Bogotá',
    wave: 3,
    timeZone: 'America/Bogota',
    reviewed: true,
    intro:
      'Bogotá es la capital de Colombia y está a más de 2.600 metros de altura, rodeada de cerros. Puedes subir a Monserrate, recorrer La Candelaria y la Plaza de Bolívar, visitar el Museo del Oro y el Museo Botero, y pasar una tarde en Usaquén.',
    bestTime:
      'El clima es fresco todo el año; los meses más secos suelen ser de diciembre a marzo y de julio a agosto.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 6 horas. Del aeropuerto El Dorado al centro se llega en bus o taxi.',
    tips: [
      'Por la altura, toma el primer día con calma y bebe mucha agua.',
      'Lleva ropa en capas: en un mismo día puede hacer sol, frío y llover.',
      'Sube a Monserrate en teleférico o funicular temprano en la mañana, cuando suele estar más despejado.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Bogotá?',
        a: 'Con 3 días recorres La Candelaria, los museos del centro, Monserrate y Usaquén. Con 4 o 5 días puedes sumar la Catedral de Sal o la Laguna de Guatavita.',
      },
      {
        q: '¿Necesito visa para viajar a Bogotá desde Chile?',
        a: 'Los chilenos pueden ingresar a Colombia sin visa por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Bogotá en un día?',
        a: 'Las más populares son la Catedral de Sal de Zipaquirá y la Laguna de Guatavita. Villa de Leyva queda más lejos y conviene dedicarle un día completo o pasar una noche allá.',
      },
    ],
  },
  {
    slug: 'florianopolis',
    cityId: 'florianopolis',
    displayName: 'Florianópolis',
    wave: 3,
    timeZone: 'America/Sao_Paulo',
    reviewed: true,
    intro:
      'Florianópolis está casi toda en una isla y es famosa por sus playas, lagunas y pueblos de pescadores. Puedes pasar días entre Praia Mole, Campeche y la Playa de Joaquina, recorrer la Laguna de la Concepción y ver el Puente Hercílio Luz iluminado de noche.',
    bestTime:
      'Las estaciones coinciden con las de Chile: el verano (diciembre a marzo) es la temporada de playa, y la primavera y el otoño son más tranquilos y templados.',
    gettingThere:
      'Desde Santiago hay vuelos directos, sobre todo en verano, de aprox. 3,5 a 4 horas; el resto del año hay vuelos con escala. Del aeropuerto a las playas se llega en bus, taxi o auto arrendado.',
    tips: [
      'Las playas están repartidas por toda la isla: arrendar un auto ayuda a moverse entre el norte, el este y el sur.',
      'En enero y febrero hay mucho tráfico: sal temprano hacia las playas.',
      'Prueba las ostras en Ribeirão da Ilha o en Santo Antônio de Lisboa.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Florianópolis?',
        a: 'Con 4 días alcanzas a conocer las playas del este y la Laguna de la Concepción. Con una semana puedes recorrer también el norte y el sur de la isla.',
      },
      {
        q: '¿Necesito visa para viajar a Florianópolis desde Chile?',
        a: 'Los chilenos pueden ingresar a Brasil con cédula de identidad por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Florianópolis en un día?',
        a: 'Las más populares son la Playa de Guarda do Embaú, Balneario Camboriú y el parque Beto Carrero World. Todas quedan en el continente y se llega en auto o bus.',
      },
    ],
  },
  {
    slug: 'cartagena-de-indias',
    cityId: 'cartagena',
    displayName: 'Cartagena de Indias',
    wave: 3,
    timeZone: 'America/Bogota',
    reviewed: true,
    intro:
      'Cartagena de Indias es una ciudad colonial a orillas del Caribe, rodeada de murallas y fortificaciones. Puedes caminar por el centro amurallado hasta la Torre del Reloj, subir al Castillo San Felipe de Barajas, recorrer Getsemaní y salir en lancha a las Islas Corales del Rosario.',
    bestTime:
      'Hace calor todo el año; de diciembre a abril es la temporada más seca, y de septiembre a noviembre llueve más.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Bogotá o Lima. Del aeropuerto al centro histórico se llega en taxi.',
    tips: [
      'Recorre el centro amurallado temprano o al atardecer: a mediodía el calor es fuerte.',
      'Usa bloqueador y bebe mucha agua, incluso en días nublados.',
      'Para las islas, elige operadores formales y confirma qué incluye el paseo antes de pagar.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Cartagena de Indias?',
        a: 'Con 3 días recorres el centro amurallado, Getsemaní y el Castillo San Felipe de Barajas. Con 4 o 5 días puedes sumar un día en las Islas Corales del Rosario o en la Península de Barú.',
      },
      {
        q: '¿Necesito visa para viajar a Cartagena de Indias desde Chile?',
        a: 'Los chilenos pueden ingresar a Colombia sin visa por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Cartagena de Indias en un día?',
        a: 'Las más populares son las Islas Corales del Rosario y la Península de Barú, en lancha, el Volcán del Totumo y San Basilio de Palenque.',
      },
    ],
  },
  {
    slug: 'medellin',
    cityId: 'medellin',
    displayName: 'Medellín',
    wave: 3,
    timeZone: 'America/Bogota',
    reviewed: true,
    intro:
      'Medellín es una ciudad de clima templado en un valle de los Andes, conocida por su transformación urbana. Puedes ver las esculturas de la Plaza Botero y el Museo de Antioquia, subir en el Metrocable de Medellín, recorrer San Javier (la Comuna 13) y pasear por el Jardín botánico de Medellín.',
    bestTime:
      'El clima es templado todo el año; los meses más secos suelen ser de diciembre a febrero y de junio a agosto.',
    gettingThere:
      'Desde Santiago hay vuelos con escala, por ejemplo vía Bogotá o Lima; revisa si hay vuelos directos en tu temporada. Del aeropuerto José María Córdova a la ciudad se llega en bus o taxi.',
    tips: [
      'El metro y el Metrocable conectan casi toda la ciudad y son una forma de ver los cerros desde arriba.',
      'Recorre San Javier con un tour guiado por residentes del barrio.',
      'Lleva una chaqueta liviana para la tarde y para el Parque ecoturístico Arví, que es más fresco.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Medellín?',
        a: 'Con 3 días recorres el centro, la Plaza Botero, San Javier y El Poblado. Con 4 o 5 días puedes sumar Guatapé y la Piedra del Peñol.',
      },
      {
        q: '¿Necesito visa para viajar a Medellín desde Chile?',
        a: 'Los chilenos pueden ingresar a Colombia sin visa por estadías turísticas; confirma los requisitos vigentes antes de viajar.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Medellín en un día?',
        a: 'La más popular es Guatapé, con la Piedra del Peñol; también puedes ir a Santa Fe de Antioquia. Jardín queda más lejos y conviene pasar una noche allá.',
      },
    ],
  },
  {
    slug: 'santiago',
    cityId: 'santiago',
    displayName: 'Santiago de Chile',
    wave: 3,
    timeZone: 'America/Santiago',
    reviewed: true,
    domestic: true,
    intro:
      'Santiago es la capital de Chile y está a los pies de la cordillera de los Andes. Puedes subir al Cerro San Cristóbal y al Cerro Santa Lucía, recorrer la Plaza de Armas de Santiago y el Palacio de La Moneda, visitar el Museo de la Memoria y los Derechos Humanos y pasear por el Barrio Lastarria.',
    bestTime:
      'Primavera (septiembre a noviembre) y otoño (marzo a mayo) son las épocas más agradables; el verano es caluroso y seco, y en invierno (junio a agosto) se puede ir a la nieve en Valle Nevado o Farellones.',
    gettingThere:
      'El Aeropuerto Internacional Arturo Merino Benítez recibe vuelos directos desde las principales ciudades de América y Europa. Del aeropuerto al centro se llega en bus, transfer o taxi.',
    tips: [
      'El metro es la forma más rápida de moverse entre el centro, Providencia y Las Condes.',
      'Sube al Cerro San Cristóbal en funicular o teleférico, idealmente en un día despejado para ver la cordillera.',
      'En invierno la contaminación puede ser alta: consulta la calidad del aire si vas a hacer deporte al aire libre.',
      'Muchos museos públicos tienen entrada gratuita; confirma los horarios en su sitio oficial.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Santiago?',
        a: 'Con 3 días recorres el centro histórico, los cerros San Cristóbal y Santa Lucía, y barrios como Lastarria y Bellavista. Con 4 o 5 días puedes sumar el Cajón del Maipo o una viña.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Santiago en un día?',
        a: 'Las más populares son el Cajón del Maipo y el Embalse El Yeso, viñas como la Viña Concha y Toro, el pueblo de Pomaire y, en invierno, los centros de ski de Valle Nevado y Farellones.',
      },
      {
        q: '¿Cuál es la mejor zona para alojarse en Santiago?',
        a: 'Para una primera visita, Providencia y el sector de Lastarria y Bellas Artes son prácticos: tienen metro, restaurantes y acceso fácil al centro.',
      },
    ],
  },
  {
    slug: 'valparaiso',
    cityId: 'valparaiso',
    displayName: 'Valparaíso',
    wave: 3,
    timeZone: 'America/Santiago',
    reviewed: true,
    domestic: true,
    intro:
      'Valparaíso es una ciudad puerto construida sobre cerros, con casas de colores, ascensores centenarios y murales en cada esquina. Puedes recorrer el Cerro Alegre y el Cerro Concepción, subir en el Ascensor Artillería, visitar La Sebastiana y caminar por el Museo a Cielo Abierto de Valparaíso.',
    bestTime:
      'De octubre a abril el clima es más templado y seco; en invierno llueve más. El Año Nuevo, con fuegos artificiales sobre la bahía, es la fecha más concurrida.',
    gettingThere:
      'Desde Santiago hay buses frecuentes que tardan aprox. 1,5 a 2 horas en recorrer unos 110 km. Viña del Mar queda al lado y se llega en metro (Merval) o bus.',
    tips: [
      'Lleva zapatos cómodos: los cerros tienen escaleras y pendientes fuertes.',
      'Combina los ascensores con caminatas para bajar de los cerros al plan.',
      'Cuida tus pertenencias en el plan y en zonas con poca gente, sobre todo de noche.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Valparaíso?',
        a: 'Con 2 días recorres los cerros Alegre y Concepción, los ascensores, La Sebastiana y el plan. Con 3 días puedes sumar Viña del Mar.',
      },
      {
        q: '¿Qué ver cerca de Valparaíso?',
        a: 'Viña del Mar queda a pocos minutos y tiene playas, el Reloj de flores y la Quinta Vergara. Más al sur está la Casa de Isla Negra, de Pablo Neruda, y al norte, las playas de Concón.',
      },
      {
        q: '¿Cómo me muevo entre los cerros de Valparaíso?',
        a: 'Los ascensores, como el Artillería o el Reina Victoria, suben del plan a los cerros en pocos minutos. También puedes usar colectivos y micros, o recorrer los cerros a pie.',
      },
    ],
  },
  {
    slug: 'punta-arenas',
    cityId: 'puntaarenas',
    // Owner order: Glaciar Perito Moreno, Parque nacional Torres del Paine, Glaciar Grey.
    mustSeeDayTrips: ['puntaarenas_50', 'puntaarenas_37', 'puntaarenas_38'],
    displayName: 'Punta Arenas',
    wave: 3,
    timeZone: 'America/Punta_Arenas',
    reviewed: true,
    domestic: true,
    intro:
      'Punta Arenas está a orillas del Estrecho de Magallanes y es la puerta de entrada a la Patagonia chilena. En la ciudad puedes recorrer la Plaza Muñoz Gamero, el Cementerio Municipal Sara Braun y el Museo Regional de Magallanes, y desde aquí salir a ver pingüinos en la Isla Magdalena o al Parque nacional Torres del Paine.',
    bestTime:
      'De noviembre a marzo los días son largos y el clima es más benigno; es también la temporada de pingüinos en la Isla Magdalena. El viento es fuerte todo el año, sobre todo en primavera y verano.',
    gettingThere:
      'Desde Santiago hay vuelos directos de aprox. 3,5 a 4 horas. Del aeropuerto al centro se llega en transfer o taxi.',
    tips: [
      'Lleva ropa en capas, cortaviento e impermeable: el clima cambia rápido y el viento es intenso.',
      'Reserva con anticipación los tours a la Isla Magdalena y los buses o traslados a Torres del Paine, sobre todo en enero y febrero.',
      'Para ir al Glaciar Perito Moreno hay que cruzar a Argentina: lleva tu cédula de identidad o pasaporte vigente y confirma los requisitos vigentes antes de viajar.',
      'Sube al Mirador Cerro de la Cruz para ver la ciudad y el estrecho.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Punta Arenas?',
        a: 'Con 2 días recorres la ciudad, sus museos y el Mirador Cerro de la Cruz, y haces una salida a ver pingüinos. Si quieres conocer Torres del Paine, suma al menos 2 o 3 días más.',
      },
      {
        q: '¿Se puede ir a Torres del Paine desde Punta Arenas en un día?',
        a: 'Sí, pero es una excursión de día completo: son aprox. 4 a 5 horas por carretera en cada sentido. Muchos viajeros prefieren pasar al menos una noche en Puerto Natales, más cerca del parque, para ver con calma el Glaciar Grey, el Lago Pehoé, los Cuernos del Paine y el Mirador Base Las Torres.',
      },
      {
        q: '¿Dónde puedo ver pingüinos cerca de Punta Arenas?',
        a: 'En la Isla Magdalena, a la que se llega en barco; en la Pingüinera Seno Otway, por tierra; y en el Parque Pingüino Rey, en Tierra del Fuego, en una excursión de día completo que cruza el estrecho.',
      },
      {
        q: '¿Qué glaciares puedo visitar desde Punta Arenas?',
        a: 'El Glaciar Grey está dentro de Torres del Paine, y los glaciares Balmaceda y Serrano se visitan en navegación desde Puerto Natales. El Glaciar Perito Moreno queda en Argentina, a aprox. 500 km por carretera vía El Calafate: es un viaje de varios días y se recomienda dormir al menos una noche allá.',
      },
    ],
  },
];

export const guideBySlug = (slug: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.slug === slug);
export const guideByCityId = (cityId: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.cityId === cityId);
