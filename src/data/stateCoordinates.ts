// Geographic coordinates, default zoom levels, and bounding metadata for all Indian States & Union Territories
// Optimized for smooth camera transitions in DeckGL / MapLibre.

export interface StateGeoConfig {
  id: string;
  name: string;
  code: string;
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  pitch?: number;
  bearing?: number;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast' | 'Islands';
  keyDistricts: string[];
}

export const STATE_GEO_CONFIGS: Record<string, StateGeoConfig> = {
  assam: {
    id: 'assam',
    name: 'Assam',
    code: 'AS',
    center: [92.85, 26.25],
    zoom: 7.1,
    region: 'Northeast',
    keyDistricts: ['Kamrup Metro', 'Dibrugarh', 'Dhubri', 'Barpeta', 'Cachar', 'Nagaon', 'Jorhat', 'Sonitpur', 'Darrang', 'Lakhimpur', 'Goalpara', 'Morigaon', 'Majuli'],
  },
  bihar: {
    id: 'bihar',
    name: 'Bihar',
    code: 'BR',
    center: [85.75, 25.75],
    zoom: 7.3,
    region: 'East',
    keyDistricts: ['Patna', 'Supaul', 'Darbhanga', 'Muzaffarpur', 'Gaya', 'Bhagalpur', 'Purnia', 'Katihar', 'Madhubani', 'Saharsa', 'Samastipur', 'Sitamarhi', 'West Champaran'],
  },
  odisha: {
    id: 'odisha',
    name: 'Odisha',
    code: 'OD',
    center: [84.45, 20.55],
    zoom: 6.9,
    region: 'East',
    keyDistricts: ['Puri', 'Bhubaneswar', 'Balasore', 'Kendrapara', 'Ganjam', 'Jagatsinghpur', 'Bhadrak', 'Cuttack', 'Koraput', 'Mayurbhanj', 'Sambalpur'],
  },
  'west-bengal': {
    id: 'west-bengal',
    name: 'West Bengal',
    code: 'WB',
    center: [87.95, 23.85],
    zoom: 7.0,
    region: 'East',
    keyDistricts: ['Kolkata', 'South 24 Parganas', 'North 24 Parganas', 'Howrah', 'Hooghly', 'Purba Medinipur', 'Jalpaiguri', 'Darjeeling', 'Murshidabad', 'Malda', 'Nadia'],
  },
  maharashtra: {
    id: 'maharashtra',
    name: 'Maharashtra',
    code: 'MH',
    center: [76.15, 19.45],
    zoom: 6.4,
    region: 'West',
    keyDistricts: ['Mumbai', 'Mumbai Suburban', 'Thane', 'Pune', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Kolhapur', 'Raigad', 'Ratnagiri', 'Amravati', 'Nanded'],
  },
  'tamil-nadu': {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    code: 'TN',
    center: [78.75, 10.95],
    zoom: 6.8,
    region: 'South',
    keyDistricts: ['Chennai', 'Thiruvallur', 'Kanchipuram', 'Cuddalore', 'Thanjavur', 'Nagapattinam', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Kanyakumari'],
  },
  kerala: {
    id: 'kerala',
    name: 'Kerala',
    code: 'KL',
    center: [76.45, 10.35],
    zoom: 7.4,
    region: 'South',
    keyDistricts: ['Thiruvananthapuram', 'Alappuzha', 'Ernakulam', 'Wayanad', 'Idukki', 'Kozhikode', 'Thrissur', 'Kollam', 'Kottayam', 'Palakkad', 'Kannur', 'Malappuram'],
  },
  gujarat: {
    id: 'gujarat',
    name: 'Gujarat',
    code: 'GJ',
    center: [71.55, 22.45],
    zoom: 6.6,
    region: 'West',
    keyDistricts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Kutch', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Porbandar', 'Navsari', 'Valsad', 'Amreli', 'Banaskantha'],
  },
  'uttar-pradesh': {
    id: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    code: 'UP',
    center: [80.65, 27.05],
    zoom: 6.5,
    region: 'North',
    keyDistricts: ['Lucknow', 'Varanasi', 'Gorakhpur', 'Prayagraj', 'Kanpur Nagar', 'Agra', 'Meerut', 'Ghaziabad', 'Gautam Buddha Nagar', 'Bareilly', 'Aligarh', 'Moradabad', 'Ayodhya', 'Jhansi'],
  },
  'andhra-pradesh': {
    id: 'andhra-pradesh',
    name: 'Andhra Pradesh',
    code: 'AP',
    center: [80.15, 15.95],
    zoom: 6.6,
    region: 'South',
    keyDistricts: ['Visakhapatnam', 'Krishna', 'Guntur', 'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'West Godavari', 'Nellore', 'Srikakulam', 'Vizianagaram', 'Kurnool', 'Anantapur', 'Chittoor'],
  },
  rajasthan: {
    id: 'rajasthan',
    name: 'Rajasthan',
    code: 'RJ',
    center: [73.95, 26.55],
    zoom: 6.1,
    region: 'North',
    keyDistricts: ['Jaipur', 'Jodhpur', 'Bikaner', 'Kota', 'Udaipur', 'Barmer', 'Jaisalmer', 'Ajmer', 'Nagaur', 'Sikar', 'Alwar', 'Bhilwara', 'Ganganagar', 'Churu'],
  },
  karnataka: {
    id: 'karnataka',
    name: 'Karnataka',
    code: 'KA',
    center: [75.95, 14.95],
    zoom: 6.6,
    region: 'South',
    keyDistricts: ['Bengaluru Urban', 'Bengaluru Rural', 'Dakshina Kannada', 'Udupi', 'Uttara Kannada', 'Mysuru', 'Belagavi', 'Kalaburagi', 'Hubballi-Dharwad', 'Ballari', 'Shivamogga', 'Tumakuru'],
  },
  'madhya-pradesh': {
    id: 'madhya-pradesh',
    name: 'Madhya Pradesh',
    code: 'MP',
    center: [78.45, 23.45],
    zoom: 6.4,
    region: 'Central',
    keyDistricts: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Chhatarpur', 'Sagar', 'Rewa', 'Satna', 'Hoshangabad', 'Ratlam', 'Vidisha', 'Sehore'],
  },
  uttarakhand: {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    code: 'UK',
    center: [79.25, 30.15],
    zoom: 7.7,
    region: 'North',
    keyDistricts: ['Dehradun', 'Haridwar', 'Nainital', 'Rudraprayag', 'Chamoli', 'Uttarkashi', 'Pithoragarh', 'Tehri Garhwal', 'Pauri Garhwal', 'Almora', 'Udham Singh Nagar', 'Bageshwar', 'Champawat'],
  },
  'himachal-pradesh': {
    id: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    code: 'HP',
    center: [77.25, 31.85],
    zoom: 7.6,
    region: 'North',
    keyDistricts: ['Shimla', 'Kangra', 'Mandi', 'Kullu', 'Solan', 'Sirmaur', 'Chamba', 'Kinnaur', 'Lahaul and Spiti', 'Hamirpur', 'Una', 'Bilaspur'],
  },
  'jammu-and-kashmir': {
    id: 'jammu-and-kashmir',
    name: 'Jammu and Kashmir',
    code: 'JK',
    center: [74.95, 33.75],
    zoom: 7.4,
    region: 'North',
    keyDistricts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Budgam', 'Pulwama', 'Kupwara', 'Udhampur', 'Kathua', 'Rajouri', 'Poonch', 'Doda', 'Kishtwar', 'Ganderbal', 'Bandipora'],
  },
  punjab: {
    id: 'punjab',
    name: 'Punjab',
    code: 'PB',
    center: [75.45, 31.15],
    zoom: 7.7,
    region: 'North',
    keyDistricts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'SAS Nagar (Mohali)', 'Hoshiarpur', 'Gurdaspur', 'Pathankot', 'Firozpur', 'Rupnagar'],
  },
  haryana: {
    id: 'haryana',
    name: 'Haryana',
    code: 'HR',
    center: [76.55, 29.25],
    zoom: 7.7,
    region: 'North',
    keyDistricts: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Rohtak', 'Hisar', 'Sonipat', 'Panchkula', 'Yamunanagar', 'Kurukshetra', 'Rewari', 'Jhajjar'],
  },
  telangana: {
    id: 'telangana',
    name: 'Telangana',
    code: 'TG',
    center: [79.15, 17.85],
    zoom: 7.1,
    region: 'South',
    keyDistricts: ['Hyderabad', 'Medchal-Malkajgiri', 'Rangareddy', 'Warangal', 'Khammam', 'Karimnagar', 'Nizamabad', 'Nalgonda', 'Bhadradri Kothagudem', 'Mahabubnagar', 'Adilabad'],
  },
  jharkhand: {
    id: 'jharkhand',
    name: 'Jharkhand',
    code: 'JH',
    center: [85.35, 23.65],
    zoom: 7.3,
    region: 'East',
    keyDistricts: ['Ranchi', 'East Singhbhum (Jamshedpur)', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Dumka', 'Giridih', 'Palamu', 'Ramgarh', 'Sahebganj'],
  },
  chhattisgarh: {
    id: 'chhattisgarh',
    name: 'Chhattisgarh',
    code: 'CG',
    center: [81.85, 21.35],
    zoom: 6.9,
    region: 'Central',
    keyDistricts: ['Raipur', 'Durg', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Bastar (Jagdalpur)', 'Surguja (Ambikapur)', 'Janjgir-Champa', 'Raigarh', 'Dhamtari'],
  },
  delhi: {
    id: 'delhi',
    name: 'Delhi NCR',
    code: 'DL',
    center: [77.15, 28.65],
    zoom: 9.8,
    region: 'North',
    keyDistricts: ['Central Delhi', 'New Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi', 'South West Delhi', 'South East Delhi', 'Shahdara'],
  },
  goa: {
    id: 'goa',
    name: 'Goa',
    code: 'GA',
    center: [74.02, 15.35],
    zoom: 9.5,
    region: 'West',
    keyDistricts: ['North Goa', 'South Goa'],
  },
  tripura: {
    id: 'tripura',
    name: 'Tripura',
    code: 'TR',
    center: [91.75, 23.85],
    zoom: 8.5,
    region: 'Northeast',
    keyDistricts: ['West Tripura (Agartala)', 'South Tripura', 'North Tripura', 'Dhalai', 'Gomati', 'Khowai', 'Sepahijala', 'Unakoti'],
  },
  meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    center: [91.45, 25.55],
    zoom: 8.3,
    region: 'Northeast',
    keyDistricts: ['East Khasi Hills (Shillong)', 'West Garo Hills (Tura)', 'Ri Bhoi', 'West Khasi Hills', 'East Jaintia Hills', 'West Jaintia Hills', 'South Garo Hills'],
  },
  manipur: {
    id: 'manipur',
    name: 'Manipur',
    code: 'MN',
    center: [93.95, 24.85],
    zoom: 8.3,
    region: 'Northeast',
    keyDistricts: ['Imphal West', 'Imphal East', 'Churachandpur', 'Thoubal', 'Bishnupur', 'Ukhrul', 'Senapati', 'Tamenglong', 'Chandel'],
  },
  nagaland: {
    id: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    center: [94.35, 26.15],
    zoom: 8.3,
    region: 'Northeast',
    keyDistricts: ['Kohima', 'Dimapur', 'Mokokchung', 'Wokha', 'Mon', 'Tuensang', 'Zunheboto', 'Phek'],
  },
  mizoram: {
    id: 'mizoram',
    name: 'Mizoram',
    code: 'MZ',
    center: [92.85, 23.35],
    zoom: 8.2,
    region: 'Northeast',
    keyDistricts: ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit', 'Lawngtlai', 'Saiha'],
  },
  'arunachal-pradesh': {
    id: 'arunachal-pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    center: [94.55, 28.05],
    zoom: 7.2,
    region: 'Northeast',
    keyDistricts: ['Papum Pare (Itanagar)', 'Changlang', 'Lohit', 'West Kameng', 'East Siang', 'Tawang', 'Lower Subansiri', 'Upper Subansiri'],
  },
  sikkim: {
    id: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    center: [88.55, 27.55],
    zoom: 8.9,
    region: 'Northeast',
    keyDistricts: ['East Sikkim (Gangtok)', 'West Sikkim (Gyalshing)', 'South Sikkim (Namchi)', 'North Sikkim (Mangan)'],
  },
  'andaman-and-nicobar-islands': {
    id: 'andaman-and-nicobar-islands',
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    center: [92.85, 11.65],
    zoom: 6.8,
    region: 'Islands',
    keyDistricts: ['South Andaman (Port Blair)', 'North and Middle Andaman', 'Nicobar'],
  },
  ladakh: {
    id: 'ladakh',
    name: 'Ladakh',
    code: 'LA',
    center: [77.65, 34.25],
    zoom: 6.9,
    region: 'North',
    keyDistricts: ['Leh', 'Kargil'],
  },
  puducherry: {
    id: 'puducherry',
    name: 'Puducherry',
    code: 'PY',
    center: [79.82, 11.93],
    zoom: 9.2,
    region: 'South',
    keyDistricts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  },
  chandigarh: {
    id: 'chandigarh',
    name: 'Chandigarh',
    code: 'CH',
    center: [76.78, 30.73],
    zoom: 10.8,
    region: 'North',
    keyDistricts: ['Chandigarh'],
  },
  'dadra-and-nagar-haveli-and-daman-and-diu': {
    id: 'dadra-and-nagar-haveli-and-daman-and-diu',
    name: 'Dadra & Nagar Haveli and Daman & Diu',
    code: 'DNHDD',
    center: [72.95, 20.35],
    zoom: 9.3,
    region: 'West',
    keyDistricts: ['Daman', 'Diu', 'Dadra and Nagar Haveli'],
  },
  lakshadweep: {
    id: 'lakshadweep',
    name: 'Lakshadweep',
    code: 'LD',
    center: [72.65, 10.55],
    zoom: 7.8,
    region: 'Islands',
    keyDistricts: ['Lakshadweep (Kavaratti)'],
  },
};

// Quick helper to get config by state name or id
export function getStateGeoConfig(stateNameOrId: string): StateGeoConfig {
  const norm = (stateNameOrId || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[&]/g, 'and');
  
  if (STATE_GEO_CONFIGS[norm]) {
    return STATE_GEO_CONFIGS[norm];
  }

  // Fallback search by name
  const found = Object.values(STATE_GEO_CONFIGS).find(
    (cfg) => cfg.name.toLowerCase() === stateNameOrId.toLowerCase() ||
             cfg.id === norm ||
             cfg.code.toLowerCase() === stateNameOrId.toLowerCase()
  );

  return found || STATE_GEO_CONFIGS.assam;
}
