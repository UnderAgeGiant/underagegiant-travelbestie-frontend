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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
    reviewed: false,
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
];

export const guideBySlug = (slug: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.slug === slug);
export const guideByCityId = (cityId: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.cityId === cityId);
