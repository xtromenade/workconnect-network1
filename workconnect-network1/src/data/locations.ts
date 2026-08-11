export interface CountryData {
  code: string;
  name: string;
  states: StateData[];
}

export interface StateData {
  name: string;
  cities: string[];
}

export const countries: CountryData[] = [
  // ── Nigeria ──────────────────────────────────────────────────────────
  {
    code: "NG", name: "Nigeria", states: [
      { name: "Abia", cities: ["Aba", "Umuahia", "Ohafia", "Arochukwu"] },
      { name: "Adamawa", cities: ["Yola", "Jimeta", "Mubi", "Numan", "Ganye"] },
      { name: "Akwa Ibom", cities: ["Uyo", "Ikot Ekpene", "Eket", "Oron"] },
      { name: "Anambra", cities: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"] },
      { name: "Bauchi", cities: ["Bauchi", "Azare", "Misau", "Jama'are", "Ningi"] },
      { name: "Bayelsa", cities: ["Yenagoa", "Brass", "Ogbia", "Sagbama"] },
      { name: "Benue", cities: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"] },
      { name: "Borno", cities: ["Maiduguri", "Biu", "Monguno", "Bama", "Dikwa"] },
      { name: "Cross River", cities: ["Calabar", "Ikom", "Ogoja", "Obudu"] },
      { name: "Delta", cities: ["Asaba", "Warri", "Sapele", "Ughelli", "Agbor"] },
      { name: "Ebonyi", cities: ["Abakaliki", "Afikpo", "Onueke", "Edda"] },
      { name: "Edo", cities: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Irrua"] },
      { name: "Ekiti", cities: ["Ado Ekiti", "Ikere", "Ise Ekiti", "Otun"] },
      { name: "Enugu", cities: ["Enugu", "Nsukka", "Awgu", "Oji River"] },
      { name: "FCT", cities: ["Abuja", "Gwagwalada", "Kuje", "Bwari", "Kwali"] },
      { name: "Gombe", cities: ["Gombe", "Kaltungo", "Dukku", "Billiri"] },
      { name: "Imo", cities: ["Owerri", "Orlu", "Okigwe", "Mbaise"] },
      { name: "Jigawa", cities: ["Dutse", "Hadejia", "Gumel", "Kazaure", "Ringim"] },
      { name: "Kaduna", cities: ["Kaduna", "Zaria", "Kafanchan", "Saminaka"] },
      { name: "Kano", cities: ["Kano", "Wudil", "Rano", "Gaya", "Bichi"] },
      { name: "Katsina", cities: ["Katsina", "Daura", "Funtua", "Malumfashi", "Dutsin-Ma"] },
      { name: "Kebbi", cities: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"] },
      { name: "Kogi", cities: ["Lokoja", "Okene", "Idah", "Kabba", "Ankpa"] },
      { name: "Kwara", cities: ["Ilorin", "Offa", "Jebba", "Omu-Aran", "Patigi"] },
      { name: "Lagos", cities: ["Ikeja", "Lagos Island", "Lekki", "Badagry", "Epe"] },
      { name: "Nasarawa", cities: ["Lafia", "Keffi", "Karu", "Akwanga", "Nasarawa"] },
      { name: "Niger", cities: ["Minna", "Suleja", "Bida", "Kontagora", "Lapai"] },
      { name: "Ogun", cities: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ilaro", "Ota"] },
      { name: "Ondo", cities: ["Akure", "Ondo", "Owo", "Okitipupa", "Ikare"] },
      { name: "Osun", cities: ["Oshogbo", "Ile Ife", "Iwo", "Ilesa", "Ede"] },
      { name: "Oyo", cities: ["Ibadan", "Ogbomosho", "Oyo", "Iseyin", "Saki"] },
      { name: "Plateau", cities: ["Jos", "Bukuru", "Pankshin", "Shendam", "Langtang"] },
      { name: "Rivers", cities: ["Port Harcourt", "Bonny", "Okrika", "Ahoada", "Degema"] },
      { name: "Sokoto", cities: ["Sokoto", "Tambuwal", "Gwadabawa", "Illela", "Wurno"] },
      { name: "Taraba", cities: ["Jalingo", "Wukari", "Takum", "Bali", "Gembu"] },
      { name: "Yobe", cities: ["Damaturu", "Potiskum", "Nguru", "Gashua", "Geidam"] },
      { name: "Zamfara", cities: ["Gusau", "Kaura Namoda", "Talata Mafara", "Maru"] },
    ]
  },

  // ── Ghana ────────────────────────────────────────────────────────────
  {
    code: "GH", name: "Ghana", states: [
      { name: "Ahafo", cities: ["Goaso", "Hwidiem", "Kenyasi"] },
      { name: "Ashanti", cities: ["Kumasi", "Obuasi", "Mampong", "Konongo"] },
      { name: "Bono", cities: ["Sunyani", "Berekum", "Dormaa Ahenkro"] },
      { name: "Bono East", cities: ["Techiman", "Kintampo", "Nkoranza"] },
      { name: "Central", cities: ["Cape Coast", "Winneba", "Mankessim", "Elmina"] },
      { name: "Eastern", cities: ["Koforidua", "Nsawam", "Akim Oda", "Suhum"] },
      { name: "Greater Accra", cities: ["Accra", "Tema", "Madina", "Ashaiman"] },
      { name: "Northern", cities: ["Tamale", "Yendi", "Savelugu", "Walewale"] },
      { name: "North East", cities: ["Nalerigu", "Gambaga", "Walewale"] },
      { name: "Oti", cities: ["Dambai", "Jasikan", "Kadjebi"] },
      { name: "Savannah", cities: ["Damongo", "Bole", "Salaga"] },
      { name: "Upper East", cities: ["Bolgatanga", "Navrongo", "Bawku"] },
      { name: "Upper West", cities: ["Wa", "Lawra", "Tumu", "Jirapa"] },
      { name: "Volta", cities: ["Ho", "Hohoe", "Keta", "Aflao"] },
      { name: "Western", cities: ["Sekondi-Takoradi", "Tarkwa", "Axim", "Prestea"] },
      { name: "Western North", cities: ["Sefwi Wiawso", "Bibiani", "Enchi"] },
    ]
  },

  // ── Kenya ────────────────────────────────────────────────────────────
  {
    code: "KE", name: "Kenya", states: [
      { name: "Baringo", cities: ["Kabarnet", "Eldama Ravine"] },
      { name: "Bomet", cities: ["Bomet", "Sotik"] },
      { name: "Bungoma", cities: ["Bungoma", "Webuye", "Kimilili"] },
      { name: "Busia", cities: ["Busia", "Malaba"] },
      { name: "Elgeyo-Marakwet", cities: ["Iten", "Kapsowar"] },
      { name: "Embu", cities: ["Embu", "Runyenjes"] },
      { name: "Garissa", cities: ["Garissa", "Dadaab"] },
      { name: "Homa Bay", cities: ["Homa Bay", "Mbita"] },
      { name: "Isiolo", cities: ["Isiolo", "Garbatulla"] },
      { name: "Kajiado", cities: ["Kajiado", "Ngong", "Kitengela"] },
      { name: "Kakamega", cities: ["Kakamega", "Mumias", "Butere"] },
      { name: "Kericho", cities: ["Kericho", "Londiani"] },
      { name: "Kiambu", cities: ["Kiambu", "Thika", "Ruiru"] },
      { name: "Kilifi", cities: ["Kilifi", "Malindi", "Watamu"] },
      { name: "Kirinyaga", cities: ["Kerugoya", "Sagana"] },
      { name: "Kisii", cities: ["Kisii", "Keroka"] },
      { name: "Kisumu", cities: ["Kisumu", "Muhoroni", "Ahero"] },
      { name: "Kitui", cities: ["Kitui", "Mwingi"] },
      { name: "Kwale", cities: ["Kwale", "Ukunda", "Msambweni"] },
      { name: "Laikipia", cities: ["Nanyuki", "Nyahururu"] },
      { name: "Lamu", cities: ["Lamu", "Mpeketoni"] },
      { name: "Machakos", cities: ["Machakos", "Athi River", "Mavoko"] },
      { name: "Makueni", cities: ["Wote", "Makindu"] },
      { name: "Mandera", cities: ["Mandera", "El Wak"] },
      { name: "Marsabit", cities: ["Marsabit", "Moyale"] },
      { name: "Meru", cities: ["Meru", "Maua", "Nkubu"] },
      { name: "Migori", cities: ["Migori", "Rongo"] },
      { name: "Mombasa", cities: ["Mombasa", "Changamwe", "Nyali"] },
      { name: "Murang'a", cities: ["Murang'a", "Kangema", "Maragua"] },
      { name: "Nairobi", cities: ["Nairobi", "Westlands", "Eastleigh"] },
      { name: "Nakuru", cities: ["Nakuru", "Naivasha", "Gilgil"] },
      { name: "Nandi", cities: ["Kapsabet", "Nandi Hills"] },
      { name: "Narok", cities: ["Narok", "Kilgoris"] },
      { name: "Nyamira", cities: ["Nyamira", "Keroka"] },
      { name: "Nyandarua", cities: ["Ol Kalou", "Engineer"] },
      { name: "Nyeri", cities: ["Nyeri", "Karatina", "Othaya"] },
      { name: "Samburu", cities: ["Maralal", "Baragoi"] },
      { name: "Siaya", cities: ["Siaya", "Bondo"] },
      { name: "Taita-Taveta", cities: ["Voi", "Wundanyi", "Taveta"] },
      { name: "Tana River", cities: ["Hola", "Garsen"] },
      { name: "Tharaka-Nithi", cities: ["Chuka", "Marimanti"] },
      { name: "Trans Nzoia", cities: ["Kitale", "Kiminini"] },
      { name: "Turkana", cities: ["Lodwar", "Lokichogio"] },
      { name: "Uasin Gishu", cities: ["Eldoret", "Burnt Forest"] },
      { name: "Vihiga", cities: ["Vihiga", "Mbale"] },
      { name: "Wajir", cities: ["Wajir", "Habaswein"] },
      { name: "West Pokot", cities: ["Kapenguria", "Ortum"] },
    ]
  },

  // ── South Africa ─────────────────────────────────────────────────────
  {
    code: "ZA", name: "South Africa", states: [
      { name: "Eastern Cape", cities: ["Gqeberha", "East London", "Mthatha", "Queenstown", "Grahamstown"] },
      { name: "Free State", cities: ["Bloemfontein", "Welkom", "Bethlehem", "Kroonstad"] },
      { name: "Gauteng", cities: ["Johannesburg", "Pretoria", "Soweto", "Vereeniging", "Krugersdorp"] },
      { name: "KwaZulu-Natal", cities: ["Durban", "Pietermaritzburg", "Richards Bay", "Newcastle", "Ladysmith"] },
      { name: "Limpopo", cities: ["Polokwane", "Tzaneen", "Mokopane", "Thohoyandou", "Phalaborwa"] },
      { name: "Mpumalanga", cities: ["Mbombela", "Witbank", "Secunda", "Ermelo", "Sabie"] },
      { name: "North West", cities: ["Mahikeng", "Rustenburg", "Klerksdorp", "Potchefstroom"] },
      { name: "Northern Cape", cities: ["Kimberley", "Upington", "Springbok", "Kuruman"] },
      { name: "Western Cape", cities: ["Cape Town", "Stellenbosch", "George", "Paarl", "Worcester"] },
    ]
  },

  // ── United States ────────────────────────────────────────────────────
  {
    code: "US", name: "United States", states: [
      { name: "Alabama", cities: ["Birmingham", "Montgomery", "Huntsville"] },
      { name: "Alaska", cities: ["Anchorage", "Juneau", "Fairbanks"] },
      { name: "Arizona", cities: ["Phoenix", "Tucson", "Mesa"] },
      { name: "Arkansas", cities: ["Little Rock", "Fayetteville", "Fort Smith"] },
      { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego"] },
      { name: "Colorado", cities: ["Denver", "Colorado Springs", "Boulder"] },
      { name: "Connecticut", cities: ["Hartford", "New Haven", "Stamford"] },
      { name: "Delaware", cities: ["Wilmington", "Dover", "Newark"] },
      { name: "District of Columbia", cities: ["Washington"] },
      { name: "Florida", cities: ["Miami", "Orlando", "Tampa"] },
      { name: "Georgia", cities: ["Atlanta", "Savannah", "Augusta"] },
      { name: "Hawaii", cities: ["Honolulu", "Hilo", "Kailua"] },
      { name: "Idaho", cities: ["Boise", "Idaho Falls", "Nampa"] },
      { name: "Illinois", cities: ["Chicago", "Springfield", "Peoria"] },
      { name: "Indiana", cities: ["Indianapolis", "Fort Wayne", "Evansville"] },
      { name: "Iowa", cities: ["Des Moines", "Cedar Rapids", "Davenport"] },
      { name: "Kansas", cities: ["Wichita", "Kansas City", "Topeka"] },
      { name: "Kentucky", cities: ["Louisville", "Lexington", "Bowling Green"] },
      { name: "Louisiana", cities: ["New Orleans", "Baton Rouge", "Shreveport"] },
      { name: "Maine", cities: ["Portland", "Augusta", "Bangor"] },
      { name: "Maryland", cities: ["Baltimore", "Annapolis", "Frederick"] },
      { name: "Massachusetts", cities: ["Boston", "Worcester", "Cambridge"] },
      { name: "Michigan", cities: ["Detroit", "Grand Rapids", "Ann Arbor"] },
      { name: "Minnesota", cities: ["Minneapolis", "Saint Paul", "Rochester"] },
      { name: "Mississippi", cities: ["Jackson", "Gulfport", "Biloxi"] },
      { name: "Missouri", cities: ["Kansas City", "St. Louis", "Springfield"] },
      { name: "Montana", cities: ["Billings", "Missoula", "Helena"] },
      { name: "Nebraska", cities: ["Omaha", "Lincoln", "Grand Island"] },
      { name: "Nevada", cities: ["Las Vegas", "Reno", "Henderson"] },
      { name: "New Hampshire", cities: ["Manchester", "Concord", "Nashua"] },
      { name: "New Jersey", cities: ["Newark", "Jersey City", "Trenton"] },
      { name: "New Mexico", cities: ["Albuquerque", "Santa Fe", "Las Cruces"] },
      { name: "New York", cities: ["New York City", "Buffalo", "Rochester"] },
      { name: "North Carolina", cities: ["Charlotte", "Raleigh", "Durham"] },
      { name: "North Dakota", cities: ["Fargo", "Bismarck", "Grand Forks"] },
      { name: "Ohio", cities: ["Columbus", "Cleveland", "Cincinnati"] },
      { name: "Oklahoma", cities: ["Oklahoma City", "Tulsa", "Norman"] },
      { name: "Oregon", cities: ["Portland", "Salem", "Eugene"] },
      { name: "Pennsylvania", cities: ["Philadelphia", "Pittsburgh", "Allentown"] },
      { name: "Rhode Island", cities: ["Providence", "Warwick", "Cranston"] },
      { name: "South Carolina", cities: ["Columbia", "Charleston", "Greenville"] },
      { name: "South Dakota", cities: ["Sioux Falls", "Rapid City", "Aberdeen"] },
      { name: "Tennessee", cities: ["Nashville", "Memphis", "Knoxville"] },
      { name: "Texas", cities: ["Houston", "Austin", "Dallas"] },
      { name: "Utah", cities: ["Salt Lake City", "Provo", "St. George"] },
      { name: "Vermont", cities: ["Burlington", "Montpelier", "Rutland"] },
      { name: "Virginia", cities: ["Richmond", "Virginia Beach", "Norfolk"] },
      { name: "Washington", cities: ["Seattle", "Spokane", "Tacoma"] },
      { name: "West Virginia", cities: ["Charleston", "Huntington", "Morgantown"] },
      { name: "Wisconsin", cities: ["Milwaukee", "Madison", "Green Bay"] },
      { name: "Wyoming", cities: ["Cheyenne", "Casper", "Laramie"] },
    ]
  },

  // ── United Kingdom ───────────────────────────────────────────────────
  {
    code: "GB", name: "United Kingdom", states: [
      { name: "England", cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol", "Sheffield", "Newcastle"] },
      { name: "Scotland", cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness"] },
      { name: "Wales", cities: ["Cardiff", "Swansea", "Newport", "Bangor"] },
      { name: "Northern Ireland", cities: ["Belfast", "Derry", "Lisburn", "Newry"] },
    ]
  },

  // ── Canada ───────────────────────────────────────────────────────────
  {
    code: "CA", name: "Canada", states: [
      { name: "Alberta", cities: ["Calgary", "Edmonton", "Red Deer"] },
      { name: "British Columbia", cities: ["Vancouver", "Victoria", "Kelowna"] },
      { name: "Manitoba", cities: ["Winnipeg", "Brandon", "Steinbach"] },
      { name: "New Brunswick", cities: ["Fredericton", "Moncton", "Saint John"] },
      { name: "Newfoundland and Labrador", cities: ["St. John's", "Corner Brook", "Gander"] },
      { name: "Northwest Territories", cities: ["Yellowknife", "Hay River"] },
      { name: "Nova Scotia", cities: ["Halifax", "Sydney", "Truro"] },
      { name: "Nunavut", cities: ["Iqaluit", "Rankin Inlet"] },
      { name: "Ontario", cities: ["Toronto", "Ottawa", "Mississauga"] },
      { name: "Prince Edward Island", cities: ["Charlottetown", "Summerside"] },
      { name: "Quebec", cities: ["Montreal", "Quebec City", "Sherbrooke"] },
      { name: "Saskatchewan", cities: ["Saskatoon", "Regina", "Prince Albert"] },
      { name: "Yukon", cities: ["Whitehorse", "Dawson City"] },
    ]
  },

  // ── India ────────────────────────────────────────────────────────────
  {
    code: "IN", name: "India", states: [
      { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati"] },
      { name: "Bihar", cities: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"] },
      { name: "Delhi", cities: ["New Delhi", "Dwarka", "Rohini"] },
      { name: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"] },
      { name: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala"] },
      { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"] },
      { name: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"] },
      { name: "Madhya Pradesh", cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior"] },
      { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik"] },
      { name: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri"] },
      { name: "Punjab", cities: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar"] },
      { name: "Rajasthan", cities: ["Jaipur", "Udaipur", "Jodhpur", "Kota"] },
      { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"] },
      { name: "Telangana", cities: ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad"] },
      { name: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Agra", "Varanasi"] },
      { name: "West Bengal", cities: ["Kolkata", "Siliguri", "Durgapur", "Asansol"] },
    ]
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

/** Returns states for a given country code, or empty array if not found. */
export function getStatesForCountry(countryCode: string): StateData[] {
  const country = countries.find((c) => c.code === countryCode);
  return country ? country.states : [];
}

/** Returns cities for a given state within a country, or empty array if not found. */
export function getCitiesForState(countryCode: string, stateName: string): string[] {
  const states = getStatesForCountry(countryCode);
  const state = states.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase()
  );
  return state ? state.cities : [];
}
