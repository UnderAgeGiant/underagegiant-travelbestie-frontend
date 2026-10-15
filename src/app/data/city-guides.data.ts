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
];

export const guideBySlug = (slug: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.slug === slug);
export const guideByCityId = (cityId: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.cityId === cityId);
