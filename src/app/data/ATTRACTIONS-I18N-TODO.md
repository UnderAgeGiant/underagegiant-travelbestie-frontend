# Attraction names pending Spanish translation

Auto-generated list of `name` fields in `src/app/data/attractions-curated.ts` that are not in Spanish or English (native-script or foreign-language text left over from the OSM/UNESCO import pipeline).

**Total: 888 entries across 65 cities.**

## How to use this file

1. Pick a city section below.
2. Open `src/app/data/attractions-curated.ts` at the given line number (line numbers are a snapshot as of generation time — re-run the scan below if the file has changed since).
3. Replace the `name:` value with a natural Spanish name for the attraction (use the `website`/`imageUrl` fields on the same entry, or a web search, to identify the place).
4. Delete the corresponding line(s) from this file once translated (or re-run the scan script to regenerate it).

Detection is heuristic: any character outside ASCII + Latin-1 Supplement (covers Spanish/French/German/Nordic accents) + common smart punctuation is flagged. This reliably catches non-Latin scripts (Thai, Arabic, Cyrillic, Han, Hangul, Devanagari, Bengali, Tibetan, Armenian, Georgian, Hebrew, Khmer, Myanmar) plus Vietnamese/Turkish/Turkmen Latin-Extended text. A few flagged entries are borderline (e.g. a single foreign proper noun like "Częstochowa" or a Rapa Nui linguistic mark) — use judgment, they are not all wrong.

## Known bugs found during the scan (not just missing translation)

- `quetzaltenango_18` (~line 25088): name is Chinese text (`游客市场当地食物的小摊`) on a Guatemala city — looks like a data pipeline mixup, not just an untranslated name.
- `sanmiguelsv_4` (~line 27397): name is otherwise-fine Spanish (`Teatro Nacional Francisco Gavidia`) but has a stray invisible LTR-mark character (U+200E) appended — strip it.

## Re-running the scan

```python
# see conversation history for the full detection script; the essence:
SAFE = lambda cp: cp < 128 or 0x00A0 <= cp <= 0x00FF
# flag any name containing a character where not SAFE(ord(ch)) and ch not in curly-quote/dash/ellipsis set
```

## Summary by city

| City | Country | Count |
|---|---|---|
| Gyumri (`gyumri`) | Armenia | 18 |
| Baku (`baku`) | Azerbaijan | 26 |
| Sheki (`sheki`) | Azerbaijan | 19 |
| Manama (`manama`) | Bahrain | 10 |
| Dhaka (`dhaka`) | Bangladesh | 16 |
| Paro (`paro`) | Bhutan | 1 |
| Punakha (`punakha`) | Bhutan | 1 |
| Hanga Roa (`hangaroa`) | Chile | 3 |
| San Miguel (`sanmiguelsv`) | El Salvador | 1 |
| Batumi (`batumi`) | Georgia | 30 |
| Stepantsminda (`stepantsminda`) | Georgia | 12 |
| Quetzaltenango (`quetzaltenango`) | Guatemala | 1 |
| Hong Kong Island (`hongkongisland`) | Hong Kong | 28 |
| Kowloon (`kowloon`) | Hong Kong | 28 |
| Tehran (`tehran`) | Iran | 29 |
| Yazd (`yazd`) | Iran | 24 |
| Eilat (`eilat`) | Israel | 21 |
| Haifa (`haifa`) | Israel | 29 |
| Tel Aviv (`telaviv`) | Israel | 28 |
| Nara (`nara`) | Japan | 30 |
| Aqaba (`aqaba`) | Jordan | 19 |
| Wadi Musa (`wadimusa`) | Jordan | 4 |
| Wadi Rum (`wadirum`) | Jordan | 2 |
| Almaty (`almaty`) | Kazakhstan | 30 |
| Astana (`astana`) | Kazakhstan | 17 |
| Turkistan (`turkistan`) | Kazakhstan | 11 |
| Kuwait City (`kuwaitcity`) | Kuwait | 14 |
| Bishkek (`bishkek`) | Kyrgyzstan | 21 |
| Osh (`osh`) | Kyrgyzstan | 10 |
| Baalbek (`baalbek`) | Lebanon | 5 |
| Beirut (`beirut`) | Lebanon | 18 |
| Macau (`macau`) | Macau | 30 |
| Langkawi (`langkawi`) | Malaysia | 1 |
| Malé (`male`) | Maldives | 4 |
| Dalanzadgad (`dalanzadgad`) | Mongolia | 2 |
| Kharkhorin (`kharkhorin`) | Mongolia | 3 |
| Chitwan (`chitwan`) | Nepal | 1 |
| Muscat (`muscat`) | Oman | 14 |
| Islamabad (`islamabad`) | Pakistan | 4 |
| Karachi (`karachi`) | Pakistan | 4 |
| Lahore (`lahore`) | Pakistan | 8 |
| Encarnación (`encarnacion`) | Paraguay | 1 |
| Jeddah (`jeddah`) | Saudi Arabia | 9 |
| Medina (`medina`) | Saudi Arabia | 18 |
| Riyadh (`riyadh`) | Saudi Arabia | 15 |
| Singapore (`singaporecity`) | Singapore | 1 |
| Busan (`busan`) | South Korea | 28 |
| Jeju (`jeju`) | South Korea | 21 |
| Kaohsiung (`kaohsiung`) | Taiwan | 30 |
| Dushanbe (`dushanbe`) | Tajikistan | 21 |
| Khorog (`khorog`) | Tajikistan | 3 |
| Ayutthaya (`ayutthaya`) | Thailand | 23 |
| Krabi (`krabi`) | Thailand | 20 |
| Phuket (`phuket`) | Thailand | 14 |
| Ephesus (`ephesus`) | Turkey | 8 |
| Ashgabat (`ashgabat`) | Turkmenistan | 8 |
| Darvaza (`darvaza`) | Turkmenistan | 1 |
| Sharjah (`sharjah`) | United Arab Emirates | 8 |
| Bukhara (`bukhara`) | Uzbekistan | 4 |
| Khiva (`khiva`) | Uzbekistan | 5 |
| Tashkent (`tashkent`) | Uzbekistan | 17 |
| Ha Long Bay (`halong`) | Vietnam | 7 |
| Ho Chi Minh City (`hochiminh`) | Vietnam | 29 |
| Hue (`hue`) | Vietnam | 19 |
| Cox's Bazar (`coxsbazar`) | Bangladesh | 1 |

## Details

### Gyumri (`gyumri`) — Armenia — 18 entries

- line 44940 — `gyumri_0` — "Ասլամազյան քույրերի պատկերասրահ"
- line 44951 — `gyumri_1` — "Ձիթողցոնց տուն-թանգարան"
- line 44961 — `gyumri_2` — "ԱՎԵՏԻՔ ԻՍԱՀԱԿՅԱՆԻ ՏՈՒՆ-ԹԱՆԳԱՐԱՆ"
- line 44971 — `gyumri_3` — "ՄՀԵՐ ՄԿՐՏՉՅԱՆԻ ԹԱՆԳԱՐԱՆ"
- line 44981 — `gyumri_4` — "Սև Բերդ"
- line 44991 — `gyumri_5` — "ՀՈՎՀԱՆՆԵՍ ՇԻՐԱԶԻ ՀՈՒՇԱՏՈՒՆ-ԹԱՆԳԱՐԱՆ"
- line 45001 — `gyumri_6` — "Շարլ Ազնավուր"
- line 45011 — `gyumri_7` — "Հայ Կաթողիկէ Սրբոց Նահատակաց Աթոռանիստ Եկեղեցի"
- line 45021 — `gyumri_8` — "Հուշարձան երկրաշարժի զոհերի հիշատակին"
- line 45031 — `gyumri_9` — "Վահան Չերազ"
- line 45041 — `gyumri_10` — "Սուրբ Աստվածածին (Յոթ Վերք)"
- line 45051 — `gyumri_11` — "Սուրբ Նշան"
- line 45061 — `gyumri_12` — "Սուրբ Հակոբ եկեղեցի"
- line 45071 — `gyumri_13` — "Սուրբ Ամենափրկիչ եկեղեցի"
- line 45081 — `gyumri_14` — "Մայր Հայաստան"
- line 45101 — `gyumri_16` — "Երկաթե շատրվան"
- line 45111 — `gyumri_17` — "Վարդան Աճեմյանի անվան դրամատիկական թատրոն"
- line 45131 — `gyumri_19` — "Ծակ քար"

### Baku (`baku`) — Azerbaijan — 26 entries

- line 45194 — `baku_0` — "Milli Azərbaycan Tarixi Muzeyi"
- line 45205 — `baku_1` — "Azərbaycan Dəmiryol Muzeyi"
- line 45216 — `baku_2` — "Qız Qalası"
- line 45227 — `baku_3` — "Şirvanşahlar Sarayı Bakı"
- line 45248 — `baku_5` — "Xalq Təhsili Muzeyi"
- line 45258 — `baku_6` — "Qoşa Qala Qapısı Bakı"
- line 45268 — `baku_7` — "Keyrəki palçıq vulkanı"
- line 45278 — `baku_8` — "Ramana Qalası"
- line 45298 — `baku_10` — "Müqədəss Məryəm Katolik Kilsəsi"
- line 45319 — `baku_12` — "Şəhidlər Məscidi"
- line 45329 — `baku_13` — "Əşkinazi yəhudilərinin Bakıdakı sinaqoqu"
- line 45339 — `baku_14` — "Göy Məscid"
- line 45349 — `baku_15` — "Müqəddəs Qriqori kilsəsi"
- line 45359 — `baku_16` — "Azərbaycan Dövlət Rus Dram Teatrı"
- line 45381 — `baku_18` — "Sahil bağı"
- line 45391 — `baku_19` — "Xəqani bağı ( Malakan bağı )"
- line 45401 — `baku_20` — "Nərimanov parkı"
- line 45411 — `baku_21` — "Qış Parkı"
- line 45421 — `baku_22` — "Bakı Zooparkı"
- line 45431 — `baku_23` — "Azərbaycan Dövlət Kukla Teatrı"
- line 45442 — `baku_24` — "Nəbabət Bağı / Botanika Bağı"
- line 45452 — `baku_25` — "Gənc Tamaşaçılar Teatrı"
- line 45463 — `baku_26` — "Heydər Əliyev Sarayı"
- line 45474 — `baku_27` — "Şərq Bazarı"
- line 45484 — `baku_28` — "Yanar Dağ"
- line 45494 — `baku_29` — "Paraşüt Qülləsi"

### Sheki (`sheki`) — Azerbaijan — 19 entries

- line 45546 — `sheki_0` — "Şəkixanovlar Ev Muzeyi"
- line 45556 — `sheki_1` — "Şəki Tarix-Diyarşünaslıq Muzeyi"
- line 45566 — `sheki_2` — "Şəki Xan Sarayı"
- line 45576 — `sheki_3` — "Üç Müqəddəs Kilsəs"
- line 45586 — `sheki_4` — "Mirzə Fətəli Axundovun Ev Muzeyi"
- line 45596 — `sheki_5` — "Müqəddəs Yelisey kilsəsi"
- line 45606 — `sheki_6` — "Ömər Əfəndi məscidi"
- line 45616 — `sheki_7` — "İmam Əli məscidi"
- line 45626 — `sheki_8` — "Yuxarı Karvansara"
- line 45636 — `sheki_9` — "Aşağı Karvansaray"
- line 45646 — `sheki_10` — "Şəki Cümə Məscidi"
- line 45667 — `sheki_12` — "Şəki Dövlət Rəsm Qalereyası"
- line 45677 — `sheki_13` — "Albanlar hamamı 19-cu əsr"
- line 45687 — `sheki_14` — "Alban kilsəsi Calğalı bulaq"
- line 45697 — `sheki_15` — "Şəki Bayraq Meydanı"
- line 45717 — `sheki_17` — "At kirayə"
- line 45727 — `sheki_18` — "Abdulxalq Hamamı"
- line 45737 — `sheki_19` — "Lütfəli Abdullayevin Evi"
- line 45747 — `sheki_20` — "Kiş Körpüsü"

### Manama (`manama`) — Bahrain — 10 entries

- line 45780 — `manama_0` — "مسجد الخميس"
- line 45791 — `manama_1` — "متحف البحرين الوطني"
- line 45802 — `manama_2` — "بيت القرآن"
- line 45843 — `manama_6` — "مسجد أحمد الفاتح"
- line 45854 — `manama_7` — "قلعة البحرين"
- line 45864 — `manama_8` — "مسرح البحرين الوطني"
- line 45875 — `manama_9` — "قصر القضيبية"
- line 45915 — `manama_13` — "القصر القديم"
- line 45925 — `manama_14` — "قلعه بوماهر"
- line 45986 — `manama_20` — "سوق باب البحرين"

### Dhaka (`dhaka`) — Bangladesh — 16 entries

- line 46061 — `dhaka_1` — "বাংলাদেশ জাতীয় জাদুঘর"
- line 46072 — `dhaka_2` — "বঙ্গভবন"
- line 46102 — `dhaka_5` — "জাতীয় সংসদ ভবন"
- line 46113 — `dhaka_6` — "বাংলাদেশ সামরিক জাদুঘর"
- line 46133 — `dhaka_8` — "লালবাগ কেল্লা"
- line 46143 — `dhaka_9` — "জিয়াউর রহমানের সমাধি"
- line 46153 — `dhaka_10` — "জাতীয় ঈদগাহ"
- line 46163 — `dhaka_11` — "চকবাজার শাহী মসজিদ"
- line 46183 — `dhaka_13` — "বিনত বিবি মসজিদ"
- line 46203 — `dhaka_15` — "জিয়া উদ্যান"
- line 46213 — `dhaka_16` — "Baldha Garden বলধা গার্ডেন"
- line 46223 — `dhaka_17` — "রমনা পার্ক"
- line 46243 — `dhaka_19` — "শাপলা চত্বর"
- line 46253 — `dhaka_20` — "সন্ত্রাস বিরোধী রাজু স্মারক ভাস্কর্য"
- line 46294 — `dhaka_24` — "ঢাকা অক্সফোর্ড ইন্টারন্যাশনাল কলেজ"
- line 46305 — `dhaka_25` — "জিন্দা পার্ক"

### Paro (`paro`) — Bhutan — 1 entries

- line 46484 — `paro_0` — "འབྲུག་རྒྱལ་ཡོངས་འགྲེམས་སྟོན་ཁང་།"

### Punakha (`punakha`) — Bhutan — 1 entries

- line 46556 — `punakha_0` — "རྒྱལ་ཡོངས་སེམས་ཅན། ༼འབྲོང་གྱིམ་ཙི༽"

### Hanga Roa (`hangaroa`) — Chile — 3 entries

- line 14590 — `hangaroa_0` — "Maꞌuŋa Tere Vaka"
- line 14623 — `hangaroa_3` — "ʻŌroŋo"
- line 14731 — `hangaroa_13` — "Ana Kakeŋa"

### San Miguel (`sanmiguelsv`) — El Salvador — 1 entries

- line 27397 — `sanmiguelsv_4` — "Teatro Nacional Francisco Gavidia‎"

### Batumi (`batumi`) — Georgia — 30 entries

- line 46600 — `batumi_0` — "გონიოს ციხე"
- line 46610 — `batumi_1` — "ხელოვნების მუზეუმი"
- line 46620 — `batumi_2` — "ბათუმის დელფინარიუმი"
- line 46631 — `batumi_3` — "არქეოლოგიური მუზეუმი"
- line 46642 — `batumi_4` — "თამარის ციხე"
- line 46652 — `batumi_5` — "ძმები ნობელების სახელობის ტექნოლოგიური მუზეუმი"
- line 46662 — `batumi_6` — "ხარიტონ ახვლედიანის სახელობის მუზეუმი"
- line 46672 — `batumi_7` — "მედეას ქანდაკება"
- line 46682 — `batumi_8` — "ბათუმის ი. ჭავჭავაძის სახელობის დრამატული თეატრი"
- line 46693 — `batumi_9` — "სულიწმიდის კათოლიკური ეკლესია"
- line 46703 — `batumi_10` — "ღვთისმშობლის შობის სახელობის საკათედრო ტაძარი"
- line 46713 — `batumi_11` — "ჩარკვიანის სახელობის სამშობიარო სახლი"
- line 46723 — `batumi_12` — "ბათუმის ცენტრალური მეჩეთი ორთა ჯამე"
- line 46733 — `batumi_13` — "ბათუმის წმინდა ქრისტეს სომხური ეკლესია"
- line 46743 — `batumi_14` — "ბათუმის სინაგოგა"
- line 46753 — `batumi_15` — "გრაფინია ფესენკოს აგარაკი"
- line 46763 — `batumi_16` — "6 მაისი პარკი"
- line 46773 — `batumi_17` — "მტირალას ეროვნული პარკი"
- line 46783 — `batumi_18` — "ნინო და ალი"
- line 46793 — `batumi_19` — "ბათუმის სახელმწიფო მუსიკალური ცენტრი"
- line 46803 — `batumi_20` — "პიაცა მოედანი"
- line 46813 — `batumi_21` — "ბათუმის თოჯინებისა და მოზარდ მაყურებელთა პროფესიული სახელმწიფო თეატრი"
- line 46823 — `batumi_22` — "ანბანის კოშკი"
- line 46833 — `batumi_23` — "ფანტაზია"
- line 46843 — `batumi_24` — "ბათუმის საზაფხულო თეატრი"
- line 46854 — `batumi_25` — "ბათუმის შუქურა"
- line 46864 — `batumi_26` — "ახალშენი"
- line 46874 — `batumi_27` — "ყიბლისთა"
- line 46884 — `batumi_28` — "ანარია"
- line 46894 — `batumi_29` — "ხეჩოკეტი"

### Stepantsminda (`stepantsminda`) — Georgia — 12 entries

- line 46936 — `stepantsminda_0` — "ტყარშეთი"
- line 46946 — `stepantsminda_1` — "არშის ციხე"
- line 46956 — `stepantsminda_2` — "სტეფანწმინდის ისტორიული მუზეუმი. ალექსანდრე ყაზბეგის სახლ-მუზეუმი"
- line 46966 — `stepantsminda_3` — "სნოს ციხე"
- line 46976 — `stepantsminda_4` — "გერგეთის სამების ეკლესია"
- line 46986 — `stepantsminda_5` — "მთავარანგელოზის ეკლესია"
- line 46996 — `stepantsminda_6` — "გარბნის ოქროს წმ. გიორგის ეკლესია"
- line 47006 — `stepantsminda_7` — "Шан / შანი"
- line 47016 — `stepantsminda_8` — "არწივისწვერი"
- line 47026 — `stepantsminda_9` — "თამარის ციხე"
- line 47046 — `stepantsminda_11` — "ელია წინასწარმეტყველის ეკლესია"
- line 47066 — `stepantsminda_13` — "ვეძის აუზი"

### Quetzaltenango (`quetzaltenango`) — Guatemala — 1 entries

- line 25088 — `quetzaltenango_18` — "游客市场当地食物的小摊"

### Hong Kong Island (`hongkongisland`) — Hong Kong — 28 entries

- line 47099 — `hongkongisland_0` — "香港大學美術博物館 University Museum & Art Gallery"
- line 47110 — `hongkongisland_1` — "香港杜莎夫人蠟像館 Madame Tussauds Hong Kong"
- line 47121 — `hongkongisland_2` — "許士芬地質博物館 Stephen Hui Geological Museum"
- line 47132 — `hongkongisland_3` — "香港賽馬博物館 The Hong Kong Racing Museum"
- line 47143 — `hongkongisland_4` — "茶具文物館 Flagstaff House Museum of Tea Ware"
- line 47154 — `hongkongisland_5` — "鯉魚門公園及度假村 Lei Yue Mun Park and Holiday Village"
- line 47165 — `hongkongisland_6` — "香港公園 Hong Kong Park"
- line 47176 — `hongkongisland_7` — "南蓮園池 Nan Lian Garden"
- line 47187 — `hongkongisland_8` — "天后廟 Tin Hau Temple"
- line 47198 — `hongkongisland_9` — "志蓮淨苑 Chi Lin Nunnery"
- line 47209 — `hongkongisland_10` — "佐敦谷公園 Jordan Valley Park"
- line 47220 — `hongkongisland_11` — "零碳天地 Zero Carbon Building"
- line 47231 — `hongkongisland_12` — "九龍城侯王古廟 Kowloon City Hau Wong Temple"
- line 47242 — `hongkongisland_13` — "東蓮覺苑 Tung Lin Kok Yuen"
- line 47253 — `hongkongisland_14` — "紅磡聖母堂 St. Mary's Church Hung Hom"
- line 47264 — `hongkongisland_15` — "摩星嶺要塞 Mount Davis Fort"
- line 47274 — `hongkongisland_16` — "香港摩天輪 The Hong Kong Observation Wheel"
- line 47285 — `hongkongisland_17` — "山頂 The Peak"
- line 47296 — `hongkongisland_18` — "馬場先難友紀念碑 Race Course Fire Memorial"
- line 47306 — `hongkongisland_19` — "前水警總部 Former Marine Police Headquarters Compound"
- line 47316 — `hongkongisland_20` — "怡和午砲 Noonday Gun"
- line 47326 — `hongkongisland_21` — "廟街夜市 Temple Street Night Market"
- line 47347 — `hongkongisland_23` — "尤德觀鳥園 Edward Youde Aviary"
- line 47368 — `hongkongisland_25` — "灣仔街市 Wanchai Market"
- line 47378 — `hongkongisland_26` — "香港仔魚類批發市場 Aberdeen Wholesale Fish Market"
- line 47388 — `hongkongisland_27` — "油麻地果欄 Yau Ma Tei Wholesale Fruit Market"
- line 47398 — `hongkongisland_28` — "園圃街雀鳥花園 Yuen Po Street Bird Garden"
- line 47408 — `hongkongisland_29` — "戲曲中心 Xiqu Centre"

### Kowloon (`kowloon`) — Hong Kong — 28 entries

- line 47451 — `kowloon_0` — "香港大學美術博物館 University Museum & Art Gallery"
- line 47462 — `kowloon_1` — "香港杜莎夫人蠟像館 Madame Tussauds Hong Kong"
- line 47473 — `kowloon_2` — "許士芬地質博物館 Stephen Hui Geological Museum"
- line 47484 — `kowloon_3` — "香港賽馬博物館 The Hong Kong Racing Museum"
- line 47495 — `kowloon_4` — "茶具文物館 Flagstaff House Museum of Tea Ware"
- line 47506 — `kowloon_5` — "鯉魚門公園及度假村 Lei Yue Mun Park and Holiday Village"
- line 47517 — `kowloon_6` — "城門棱堡 Shing Mun Redoubt"
- line 47527 — `kowloon_7` — "香港公園 Hong Kong Park"
- line 47538 — `kowloon_8` — "南蓮園池 Nan Lian Garden"
- line 47549 — `kowloon_9` — "天后廟 Tin Hau Temple"
- line 47560 — `kowloon_10` — "志蓮淨苑 Chi Lin Nunnery"
- line 47571 — `kowloon_11` — "佐敦谷公園 Jordan Valley Park"
- line 47582 — `kowloon_12` — "零碳天地 Zero Carbon Building"
- line 47593 — `kowloon_13` — "九龍城侯王古廟 Kowloon City Hau Wong Temple"
- line 47604 — `kowloon_14` — "東蓮覺苑 Tung Lin Kok Yuen"
- line 47615 — `kowloon_15` — "紅磡聖母堂 St. Mary's Church Hung Hom"
- line 47626 — `kowloon_16` — "荃灣海濱公園 Tsuen Wan Riviera Park"
- line 47637 — `kowloon_17` — "摩星嶺要塞 Mount Davis Fort"
- line 47647 — `kowloon_18` — "山頂 The Peak"
- line 47658 — `kowloon_19` — "馬場先難友紀念碑 Race Course Fire Memorial"
- line 47668 — `kowloon_20` — "前水警總部 Former Marine Police Headquarters Compound"
- line 47678 — `kowloon_21` — "廟街夜市 Temple Street Night Market"
- line 47699 — `kowloon_23` — "尤德觀鳥園 Edward Youde Aviary"
- line 47709 — `kowloon_24` — "葵青劇院 Kwai Tsing Theatre"
- line 47731 — `kowloon_26` — "灣仔街市 Wanchai Market"
- line 47741 — `kowloon_27` — "香港仔魚類批發市場 Aberdeen Wholesale Fish Market"
- line 47751 — `kowloon_28` — "油麻地果欄 Yau Ma Tei Wholesale Fruit Market"
- line 47761 — `kowloon_29` — "園圃街雀鳥花園 Yuen Po Street Bird Garden"

### Tehran (`tehran`) — Iran — 29 entries

- line 47836 — `tehran_0` — "موزه سینمای ایران"
- line 47847 — `tehran_1` — "مجموعه فرهنگی تاریخی سعدآباد"
- line 47858 — `tehran_2` — "کاخ موزه گلستان"
- line 47869 — `tehran_3` — "موزه رضا عباسی"
- line 47880 — `tehran_4` — "موزه شهدا"
- line 47890 — `tehran_5` — "عمارت کوشک فخرالدوله"
- line 47900 — `tehran_6` — "بازار تجریش"
- line 47911 — `tehran_7` — "باغ گیاه‌ شناسی ملی ایران"
- line 47922 — `tehran_8` — "بوستان جنگلی چیتگر"
- line 47933 — `tehran_9` — "پارک ارم"
- line 47944 — `tehran_10` — "مجموعه فرهنگی تاریخی کاخ نیاوران"
- line 47955 — `tehran_11` — "قلعه گبری"
- line 47965 — `tehran_12` — "بوستان اندیشه"
- line 47976 — `tehran_13` — "کاخ ثابت پاسال"
- line 47986 — `tehran_14` — "حاج رجب علی"
- line 47996 — `tehran_15` — "کلیسای وارطان مقدس"
- line 48006 — `tehran_16` — "امامزاده اسماعیل"
- line 48016 — `tehran_17` — "سقاخانه گذر امام‌زاده یحیی"
- line 48026 — `tehran_18` — "عمارت فخرالدوله"
- line 48036 — `tehran_19` — "کلیسای ارتدکس سنت نیکولاس"
- line 48046 — `tehran_20` — "آرامگاه شیخ صدوق"
- line 48056 — `tehran_21` — "باغ وحش ارم"
- line 48066 — `tehran_22` — "باغ پرندگان تهران"
- line 48076 — `tehran_23` — "بازار خانات"
- line 48086 — `tehran_24` — "خانه مینایی"
- line 48096 — `tehran_25` — "تئاتر شهر"
- line 48106 — `tehran_26` — "سردر باغ ملی"
- line 48116 — `tehran_27` — "خانه تاریخی ظهیرالاسلام"
- line 48126 — `tehran_28` — "کلکچال"

### Yazd (`yazd`) — Iran — 24 entries

- line 48178 — `yazd_0` — "موزه سکه و مردم شناسی حیدرزاده"
- line 48188 — `yazd_1` — "موزه آب"
- line 48198 — `yazd_2` — "موزه آیینه و روشنایی یزد"
- line 48208 — `yazd_3` — "قلعه ابرندآباد"
- line 48218 — `yazd_4` — "دخمه زرتشتیان"
- line 48228 — `yazd_5` — "آب انبار شش بادگیر"
- line 48238 — `yazd_6` — "بازار مسگرها"
- line 48248 — `yazd_7` — "مسجد فُرط"
- line 48258 — `yazd_8` — "مسجد علاقه بند"
- line 48268 — `yazd_9` — "آتشکده زرتشتیان"
- line 48278 — `yazd_10` — "مسجد ملّا اسماعیل"
- line 48288 — `yazd_11` — "تکیه امیر چخماق"
- line 48298 — `yazd_12` — "حسینیه فهادان"
- line 48308 — `yazd_13` — "آب‌انبار کوشک نو"
- line 48318 — `yazd_14` — "باغ دولت آباد"
- line 48328 — `yazd_15` — "آب انبار رستم گیو"
- line 48338 — `yazd_16` — "ساعت مارکار"
- line 48348 — `yazd_17` — "خانه هرندی ها"
- line 48358 — `yazd_18` — "بادگیر باغ دولت آباد"
- line 48368 — `yazd_19` — "خانه ملک زاده"
- line 48378 — `yazd_20` — "موزه آسیاب آبی وزیر"
- line 48388 — `yazd_21` — "موزه زرتشتیان یزد"
- line 48398 — `yazd_22` — "موقوفه سرای خان کهنه سرای دوم (بازار طلا فروشان یزد)"
- line 48408 — `yazd_23` — "بوستان ناجی"

### Eilat (`eilat`) — Israel — 21 entries

- line 49129 — `eilat_0` — "מוזיאון להסטוריה אילת"
- line 49140 — `eilat_1` — "טופ 94"
- line 49151 — `eilat_2` — "פארק המצפה התת-ימי"
- line 49162 — `eilat_3` — "ריף הדולפינים"
- line 49173 — `eilat_4` — "قلعة العقبة"
- line 49183 — `eilat_5` — "متحف آثار إقليم العقبة"
- line 49193 — `eilat_6` — "דגל הדיו"
- line 49213 — `eilat_8` — "آيلة"
- line 49233 — `eilat_10` — "חוף הנסיכה"
- line 49244 — `eilat_11` — "פארק אופירה"
- line 49254 — `eilat_12` — "הר שלמה"
- line 49264 — `eilat_13` — "חוות גמלים"
- line 49274 — `eilat_14` — "צוקי גשרון"
- line 49284 — `eilat_15` — "חוף הדולפין"
- line 49294 — `eilat_16` — "הר שחמון"
- line 49304 — `eilat_17` — "רמת יותם"
- line 49314 — `eilat_18` — "הר שחורת"
- line 49324 — `eilat_19` — "הר אמיר"
- line 49334 — `eilat_20` — "הר יהושפט"
- line 49354 — `eilat_22` — "אתר צלילה -סטי\"ל (24 מטר)"
- line 49365 — `eilat_23` — "אילת עירי"

### Haifa (`haifa`) — Israel — 29 entries

- line 48809 — `haifa_0` — "מוזיאון חיפה לאמנות"
- line 48820 — `haifa_1` — "אנדרטת הנספים בשריפה בכרמל"
- line 48831 — `haifa_2` — "הגנים הבהאים"
- line 48842 — `haifa_3` — "מוזיאון ההעפלה וחיל הים"
- line 48852 — `haifa_4` — "מוזיאון דגון"
- line 48862 — `haifa_5` — "גן החיות הלימודי חיפה"
- line 48873 — `haifa_6` — "מחנה עתלית"
- line 48883 — `haifa_7` — "מוזיאון טיקוטין לאמנות יפנית"
- line 48904 — `haifa_9` — "חי-בר כרמל"
- line 48915 — `haifa_10` — "תל שיקמונה"
- line 48925 — `haifa_11` — "כנסיית יוחנן הקדוש"
- line 48935 — `haifa_12` — "הגנים הבהאיים"
- line 48946 — `haifa_13` — "הציפור הפצועה"
- line 48956 — `haifa_14` — "אנדרטת אח\"י אילת"
- line 48966 — `haifa_15` — "בוסתן כיאט"
- line 48986 — `haifa_17` — "בית הגפן"
- line 48997 — `haifa_18` — "גן פסלי אורסולה מלבין"
- line 49007 — `haifa_19` — "פארק הכט"
- line 49017 — `haifa_20` — "כיפת הבאב"
- line 49027 — `haifa_21` — "טכניון הגן האקולוגי"
- line 49037 — `haifa_22` — "جامع سيدنا محمود"
- line 49047 — `haifa_23` — "ישיבת אור וישועה"
- line 49057 — `haifa_24` — "שוק תלפיות"
- line 49067 — `haifa_25` — "מערת אליהו"
- line 49077 — `haifa_26` — "תיאטרון חיפה"
- line 49087 — `haifa_27` — "אובליסק הטכניון"
- line 49097 — `haifa_28` — "רום כרמל"
- line 49107 — `haifa_29` — "הר ערקן"
- line 49117 — `haifa_30` — "Jardines Baháʼís de Haifa"

### Tel Aviv (`telaviv`) — Israel — 28 entries

- line 48462 — `telaviv_1` — "היכל העצמאות"
- line 48484 — `telaviv_3` — "מוזיאון בית יוסף באו"
- line 48495 — `telaviv_4` — "מוזיאון ארץ ישראל"
- line 48506 — `telaviv_5` — "תל קנה"
- line 48517 — `telaviv_6` — "גן הבנים"
- line 48528 — `telaviv_7` — "ראש ציפור"
- line 48539 — `telaviv_8` — "גן הקקטוסים"
- line 48550 — `telaviv_9` — "הגן הגזום"
- line 48561 — `telaviv_10` — "מימדיון"
- line 48572 — `telaviv_11` — "לונה פארק"
- line 48583 — `telaviv_12` — "מערות אפקה"
- line 48594 — `telaviv_13` — "שוק הפשפשים"
- line 48605 — `telaviv_14` — "ימית 2000"
- line 48616 — `telaviv_15` — "כנסיית עמנואל"
- line 48627 — `telaviv_16` — "גאולת ישראל"
- line 48638 — `telaviv_17` — "שרונה מרקט"
- line 48649 — `telaviv_18` — "הפארק האקולוגי הוד השרון"
- line 48660 — `telaviv_19` — "שבע טחנות"
- line 48671 — `telaviv_20` — "הספארי ברמת גן"
- line 48682 — `telaviv_21` — "תל יונה"
- line 48692 — `telaviv_22` — "תל זיתון"
- line 48702 — `telaviv_23` — "הקאמרי"
- line 48713 — `telaviv_24` — "תאטרון גשר"
- line 48724 — `telaviv_25` — "בית הכנסת הגדול"
- line 48734 — `telaviv_26` — "עקלתון"
- line 48745 — `telaviv_27` — "פסל שער האמונה"
- line 48756 — `telaviv_28` — "היכל התרבות פתח תקווה"
- line 48767 — `telaviv_29` — "קול יהודה"

### Nara (`nara`) — Japan — 30 entries

- line 49388 — `nara_0` — "松伯美術館"
- line 49399 — `nara_1` — "平城宮跡資料館"
- line 49410 — `nara_2` — "京都府立山城郷土資料館（ふるさとミュージアム山城）"
- line 49420 — `nara_3` — "中野美術館"
- line 49430 — `nara_4` — "大和文華館"
- line 49440 — `nara_5` — "郡山城跡"
- line 49450 — `nara_6` — "元興寺小塔院跡"
- line 49460 — `nara_7` — "薬師寺"
- line 49471 — `nara_8` — "喜光寺"
- line 49482 — `nara_9` — "海龍王寺"
- line 49493 — `nara_10` — "法華寺"
- line 49504 — `nara_11` — "白毫寺 (Byakugō-ji)"
- line 49514 — `nara_12` — "頭塔 (Zuto Tower)"
- line 49524 — `nara_13` — "平城天皇陵"
- line 49534 — `nara_14` — "史跡 元興寺小塔院跡"
- line 49544 — `nara_15` — "依水園"
- line 49555 — `nara_16` — "吉城園"
- line 49566 — `nara_17` — "旧大乗院庭園"
- line 49576 — `nara_18` — "関西文化学術研究都市記念公園"
- line 49586 — `nara_19` — "子規の庭"
- line 49596 — `nara_20` — "夕日地蔵"
- line 49606 — `nara_21` — "箱本館紺屋"
- line 49616 — `nara_22` — "朱雀門"
- line 49626 — `nara_23` — "若草山"
- line 49636 — `nara_24` — "高円山"
- line 49646 — `nara_25` — "春日山"
- line 49656 — `nara_26` — "芳山"
- line 49666 — `nara_27` — "花山"
- line 49676 — `nara_28` — "中谷堂"
- line 49687 — `nara_29` — "ならまち格子の家"

### Aqaba (`aqaba`) — Jordan — 19 entries

- line 50048 — `aqaba_0` — "מוזיאון להסטוריה אילת"
- line 50059 — `aqaba_1` — "טופ 94"
- line 50070 — `aqaba_2` — "פארק המצפה התת-ימי"
- line 50081 — `aqaba_3` — "ריף הדולפינים"
- line 50092 — `aqaba_4` — "قلعة العقبة"
- line 50102 — `aqaba_5` — "متحف آثار إقليم العقبة"
- line 50112 — `aqaba_6` — "דגל הדיו"
- line 50132 — `aqaba_8` — "آيلة"
- line 50152 — `aqaba_10` — "פארק אופירה"
- line 50162 — `aqaba_11` — "חוות גמלים"
- line 50172 — `aqaba_12` — "חוף הדולפין"
- line 50182 — `aqaba_13` — "مرصد طيور العقبة"
- line 50192 — `aqaba_14` — "הר שחמון"
- line 50202 — `aqaba_15` — "רמת יותם"
- line 50212 — `aqaba_16` — "גבעת שחורת"
- line 50222 — `aqaba_17` — "جبل الأخضر"
- line 50232 — `aqaba_18` — "הר צפחות"
- line 50252 — `aqaba_20` — "אתר צלילה -סטי\"ל (24 מטר)"
- line 50263 — `aqaba_21` — "אילת עירי"

### Wadi Musa (`wadimusa`) — Jordan — 4 entries

- line 49731 — `wadimusa_0` — "الوعيرة"
- line 49751 — `wadimusa_2` — "البترا"
- line 49832 — `wadimusa_10` — "جبل المذبح"
- line 49892 — `wadimusa_16` — "جبل النبي هارون"

### Wadi Rum (`wadirum`) — Jordan — 2 entries

- line 49934 — `wadirum_1` — "وادي رم"
- line 49964 — `wadirum_4` — "أبو نخيلة"

### Almaty (`almaty`) — Kazakhstan — 30 entries

- line 50296 — `almaty_0` — "Бекініс"
- line 50307 — `almaty_1` — "Дінмұхамед Қонаев Пәтер Мұражайы"
- line 50318 — `almaty_2` — "Қазақстан Республикасының Мемлекеттік Орталық Мұражайы"
- line 50329 — `almaty_3` — "ҚР Мемлекеттік Ә. Қастеев атындағы өнер мұражайы"
- line 50340 — `almaty_4` — "Қазақстан Республикасы орталық теміржол көлігі мұражайы"
- line 50350 — `almaty_5` — "Вознесенск Шіркеуі"
- line 50361 — `almaty_6` — "Ықылас атындағы халық музыкалық аспаптар мұражайы"
- line 50371 — `almaty_7` — "Орталық Демалыс және Мәдениет Саябағы"
- line 50382 — `almaty_8` — "Бас Ботаникалық Бақ"
- line 50393 — `almaty_9` — "Д. А. Қонаев ескерткіші"
- line 50403 — `almaty_10` — "Аманкелді Иманов"
- line 50413 — `almaty_11` — "Абылай хан"
- line 50423 — `almaty_12` — "Абай Ескерткіші"
- line 50433 — `almaty_13` — "ARTиШОК"
- line 50444 — `almaty_14` — "Храм в честь иконы Божией Матери Всех скорбящих Радосте"
- line 50454 — `almaty_15` — "Никольск шіркеуі"
- line 50464 — `almaty_16` — "Михаил Лермонтов атындағы мемлекеттік академиялық орыс драма театры"
- line 50475 — `almaty_17` — "Н. Сац атындағы балалар мен жасөспірімдерге арналған театр"
- line 50486 — `almaty_18` — "28 гвардия-панфиловшылар атын. саябақ"
- line 50496 — `almaty_19` — "Баум Тоғайы"
- line 50506 — `almaty_20` — "Қазақстан Республикасының Тұңғыш Президентінің атындағы Саябақ"
- line 50516 — `almaty_21` — "Алматы хайуанаттар бағы"
- line 50527 — `almaty_22` — "Храм Христа Спасителя"
- line 50537 — `almaty_23` — "София атындағы собор"
- line 50547 — `almaty_24` — "Абай атындағы Қазақ Ұлттық опера және балет театры"
- line 50558 — `almaty_25` — "Көк Базар"
- line 50568 — `almaty_26` — "Зазеркалье"
- line 50578 — `almaty_27` — "Қазақстан Республикасы Президентінің мұрағаты"
- line 50588 — `almaty_28` — "Ғалымдар Үйі"
- line 50598 — `almaty_29` — "\"Көк-Төбе\" теледидар мұнарасы"

### Astana (`astana`) — Kazakhstan — 17 entries

- line 50640 — `astana_0` — "Қазақстан Республикасының Ұлттық Мұражайы"
- line 50651 — `astana_1` — "Бейт Рахель Хабад Любавич"
- line 50662 — `astana_2` — "Ботаникалық бақ"
- line 50673 — `astana_3` — "Атамекен Қазақстан картасы этно-мемориалдық кешені"
- line 50683 — `astana_4` — "Жетісу саябағы"
- line 50693 — `astana_5` — "Бәйтерек"
- line 50703 — `astana_6` — "Әзірет Сұлтан мешіті"
- line 50713 — `astana_7` — "Мәңгілік Ел салтанат қақпасы"
- line 50723 — `astana_8` — "Астана Опера"
- line 50745 — `astana_10` — "Әбу Насыр әл-Фараби мешіті"
- line 50755 — `astana_11` — "Астана-Экспо КС"
- line 50766 — `astana_12` — "Қазақстан Теміржол тарихы Мұражайы"
- line 50776 — `astana_13` — "ҚР Тұңғыш Президенті Н. Ә. Назарбаевтың мұражайы"
- line 50786 — `astana_14` — "Т34-85"
- line 50796 — `astana_15` — "Студия 1337"
- line 50827 — `astana_18` — "Дракон"
- line 50837 — `astana_19` — "Олимпиада сақиналары"

### Turkistan (`turkistan`) — Kazakhstan — 11 entries

- line 50879 — `turkistan_0` — "«Әзірет Сұлтан» Ұлттық тарихи-мәдени музей-қорығы"
- line 50890 — `turkistan_1` — "Қожа Ахмет Ясауи кесенесі"
- line 50900 — `turkistan_2` — "Этнографиялық Мұражай"
- line 50910 — `turkistan_3` — "Шығыс Моншасы"
- line 50920 — `turkistan_4` — "Тұңғыш Президент Мұражайы"
- line 50930 — `turkistan_5` — "Гол+Пас БК"
- line 50940 — `turkistan_6` — "Олимп БК"
- line 50950 — `turkistan_7` — "Бильярд"
- line 50960 — `turkistan_8` — "Көлтөбе көне қалашығы"
- line 50970 — `turkistan_9` — "Түйе керуені"
- line 50980 — `turkistan_10` — "Сәулет ескерткіші"

### Kuwait City (`kuwaitcity`) — Kuwait — 14 entries

- line 51003 — `kuwaitcity_0` — "داو فاتح الخير"
- line 51014 — `kuwaitcity_1` — "متحف الكويت الوطني"
- line 51024 — `kuwaitcity_2` — "مسجد الإمام زين العابدين"
- line 51035 — `kuwaitcity_3` — "قصر السيف"
- line 51045 — `kuwaitcity_4` — "حديقة الحيوان"
- line 51055 — `kuwaitcity_5` — "أبراج الكويت"
- line 51065 — `kuwaitcity_6` — "برج التحرير"
- line 51075 — `kuwaitcity_7` — "المركز العلمي"
- line 51097 — `kuwaitcity_9` — "متحف طارق رجب"
- line 51108 — `kuwaitcity_10` — "بيت دكسون"
- line 51118 — `kuwaitcity_11` — "قصر نايف"
- line 51128 — `kuwaitcity_12` — "حديقة الحيوانات في الكويت"
- line 51148 — `kuwaitcity_14` — "عكاز"
- line 51158 — `kuwaitcity_15` — "قصر الشيخ خزعل"

### Bishkek (`bishkek`) — Kyrgyzstan — 21 entries

- line 51201 — `bishkek_0` — "Зоологический музей"
- line 51212 — `bishkek_1` — "Национальный Исторический Музей"
- line 51223 — `bishkek_2` — "Мемориальный дом-музей М.В.Фрунзе"
- line 51234 — `bishkek_3` — "Дом-музей Алыкула Осмонова"
- line 51244 — `bishkek_4` — "Найманбай манасчы"
- line 51255 — `bishkek_5` — "Панфилов атындагы сейилбак"
- line 51275 — `bishkek_7` — "Ботанический сад \"КНУ имени Жусупа Баласагына\""
- line 51285 — `bishkek_8` — "Кара-Жыгач багы"
- line 51295 — `bishkek_9` — "Воскресенский собор"
- line 51305 — `bishkek_10` — "Ошский рынок"
- line 51315 — `bishkek_11` — "Дендрарий-заповедник имени Гареева"
- line 51326 — `bishkek_12` — "Ботанический сад имени Э.З. Гареева"
- line 51337 — `bishkek_13` — "Кыргызско-Российских отношений"
- line 51347 — `bishkek_14` — "Филармония"
- line 51357 — `bishkek_15` — "Русский Драматический Театр"
- line 51367 — `bishkek_16` — "Музей изобразительных искусств имени Гапара Айтиева"
- line 51378 — `bishkek_17` — "Кузнечная крепость"
- line 51388 — `bishkek_18` — "Евразия паркы"
- line 51399 — `bishkek_19` — "Иллюзион"
- line 51409 — `bishkek_20` — "Парк \"Асанбай\""
- line 51419 — `bishkek_21` — "Нулевой километр"

### Osh (`osh`) — Kyrgyzstan — 10 entries

- line 51473 — `osh_0` — "Историко-этнографический музей Сулайман-Тоо"
- line 51484 — `osh_1` — "Айкол Манас"
- line 51494 — `osh_2` — "Узбекский драматический театр имени З. М. Бабура"
- line 51504 — `osh_3` — "Археологический музей"
- line 51524 — `osh_5` — "Тургунбай Садыков атындагы Ош облустук корком сурот музейи"
- line 51534 — `osh_6` — "Поселение бронзового века"
- line 51544 — `osh_7` — "Средневековая баня"
- line 51564 — `osh_9` — "Бел таш"
- line 51574 — `osh_10` — "Кол таш"
- line 51584 — `osh_11` — "Памятник Курманжан Датка"

### Baalbek (`baalbek`) — Lebanon — 5 entries

- line 51914 — `baalbek_0` — "حجر الحبلى"
- line 51924 — `baalbek_1` — "معبد باخوس"
- line 51934 — `baalbek_2` — "معبد جوبيتر"
- line 51954 — `baalbek_4` — "قلعة بعلبك"
- line 51984 — `baalbek_7` — "אוכף טופוגרפי"

### Beirut (`beirut`) — Lebanon — 18 entries

- line 51617 — `beirut_0` — "بيت بيروت"
- line 51638 — `beirut_2` — "المتحف الأثري في الجامعة الأمريكية في بيروت"
- line 51658 — `beirut_4` — "قلعة بيروت البحرية"
- line 51668 — `beirut_5` — "المتحف الوطني"
- line 51679 — `beirut_6` — "مسجد الداعوق"
- line 51690 — `beirut_7` — "نصب بشير جميل التذكاري"
- line 51700 — `beirut_8` — "اغتيال رفيق الحريري"
- line 51710 — `beirut_9` — "مقبرة شهداء صبرا وشاتيلا الفلسطينيين"
- line 51720 — `beirut_10` — "مضمار سباق الخيل الروماني"
- line 51730 — `beirut_11` — "حرش بيروت"
- line 51740 — `beirut_12` — "كاتدرائية القديس جاورجيوس للروم الأرثوذكس"
- line 51750 — `beirut_13` — "كاتدرائية مار جرجس المارونية"
- line 51770 — `beirut_15` — "جامع محمد الأمين"
- line 51780 — `beirut_16` — "تمثال الشهداء"
- line 51800 — `beirut_18` — "البيضة"
- line 51810 — `beirut_19` — "البيت الوردي"
- line 51820 — `beirut_20` — "البعصة"
- line 51830 — `beirut_21` — "المنارة القديمة"

### Macau (`macau`) — Macau — 30 entries

- line 52017 — `macau_0` — "沙梨頭更館 Posto do Guarda-Nocturno no Patane"
- line 52028 — `macau_1` — "圆明新园"
- line 52039 — `macau_2` — "澳門回歸賀禮陳列館 Museu das Ofertas sobre a Transferência de Soberania de Macau"
- line 52050 — `macau_3` — "澳門教科文中心 Centro Unesco de Macau"
- line 52061 — `macau_4` — "路氹歷史館 Museu da História da Taipa e Coloane"
- line 52072 — `macau_5` — "大炮台 Fortaleza do Monte"
- line 52082 — `macau_6` — "聖老楞佐堂 Igreja de S. Lourenço"
- line 52093 — `macau_7` — "望廈炮台 Fortaleza de Mong-Há"
- line 52103 — `macau_8` — "東望洋炮台 Fortaleza da Guia"
- line 52113 — `macau_9` — "關閘 Portas do Cerco"
- line 52123 — `macau_10` — "馬禮遜教堂 Capela Protestante de Macau"
- line 52133 — `macau_11` — "三街會館 Templo Sam Kai Vui Kun"
- line 52143 — `macau_12` — "望德聖母堂 Igreja de São Lázaro"
- line 52153 — `macau_13` — "舊城牆遺址 Troço das Antigas Muralhas de Defesa"
- line 52163 — `macau_14` — "柯邦迪前地 Praça de Ponte e Horta"
- line 52173 — `macau_15` — "華士古達嘉馬花園 Jardim Vasco da Gama"
- line 52183 — `macau_16` — "得勝花園 Jardim da Vitória"
- line 52193 — `macau_17` — "金蓮花廣場 A Praça Flor de Lótus"
- line 52203 — `macau_18` — "澳門文化中心 Centro Cultural de Macau"
- line 52214 — `macau_19` — "媽閣廟 Templo de A-Ma"
- line 52224 — `macau_20` — "耶穌會紀念廣場"
- line 52234 — `macau_21` — "營地街市市政綜合大樓 Complexo Municipal de Sao Domingos"
- line 52244 — `macau_22` — "沙梨頭街市  Mercado Municipal do Patane"
- line 52254 — `macau_23` — "雀仔園街市 Mercado da Horta da Mitra"
- line 52264 — `macau_24` — "紅街市 Mercado Municipal Almirante Lacerda"
- line 52274 — `macau_25` — "台山街市市政綜合大樓 Complexo Municipal do Mercado de Tamagnini Barbosa"
- line 52284 — `macau_26` — "澳門百老匯 Broadway Macau"
- line 52295 — `macau_27` — "擁抱 Abraço"
- line 52305 — `macau_28` — "歐維士石像 Monumento a Jorge Álvares"
- line 52315 — `macau_29` — "東方基金會會址 Casa Garden"

### Langkawi (`langkawi`) — Malaysia — 1 entries

- line 41586 — `langkawi_0` — "อุทยานแห่งชาติตะรุเตา"

### Malé (`male`) — Maldives — 4 entries

- line 52368 — `male_1` — "ސަލްމާން ރަސްގެފާނުގެ މިސްކިތް"
- line 52378 — `male_2` — "ބިހުރޯޒު ކަމަނާ މިސްކިތް"
- line 52388 — `male_3` — "ހުކުރު މިސްކިތް"
- line 52418 — `male_6` — "ޤައުމީ ދާރުލްއާސާރު"

### Dalanzadgad (`dalanzadgad`) — Mongolia — 2 entries

- line 52629 — `dalanzadgad_0` — "Өмнөговь аймгийн Соёл амралтын хүрээлэн"
- line 52639 — `dalanzadgad_1` — "고비3일 도심"

### Kharkhorin (`kharkhorin`) — Mongolia — 3 entries

- line 52536 — `kharkhorin_0` — "Эрдэнэ Зуу"
- line 52546 — `kharkhorin_1` — "Хархорум"
- line 52597 — `kharkhorin_6` — "Хар Хорум"

### Chitwan (`chitwan`) — Nepal — 1 entries

- line 52714 — `chitwan_1` — "चितवन राष्ट्रिय निकुञ्‍ज"

### Muscat (`muscat`) — Oman — 14 entries

- line 52787 — `muscat_0` — "متحف التاريخ الطبيعي"
- line 52797 — `muscat_1` — "Oil and Gas Exhibition Center مكتب نفط عمان"
- line 52807 — `muscat_2` — "جامع السلطان قابوس الأكبر"
- line 52838 — `muscat_5` — "دار الأوبرا السلطانية مسقط"
- line 52849 — `muscat_6` — "جامع الزواوي"
- line 52859 — `muscat_7` — "حديقة القرم الطبيعية"
- line 52869 — `muscat_8` — "حديقة العامرات"
- line 52879 — `muscat_9` — "برج الصحوة"
- line 52889 — `muscat_10` — "جبل قرمذل"
- line 52899 — `muscat_11` — "جبل مريوة"
- line 52909 — `muscat_12` — "جبل مكيب"
- line 52919 — `muscat_13` — "القبة الفلكية مسقط"
- line 52930 — `muscat_14` — "بناية الريم"
- line 52972 — `muscat_18` — "مرح لاند"

### Islamabad (`islamabad`) — Pakistan — 4 entries

- line 53445 — `islamabad_6` — "پاکستان یادگار"
- line 53455 — `islamabad_7` — "فاطمہ جناح پارک"
- line 53465 — `islamabad_8` — "فیصل مسجد"
- line 53535 — `islamabad_15` — "تاج علی ہاؤس مرآبادی"

### Karachi (`karachi`) — Pakistan — 4 entries

- line 53679 — `karachi_5` — "زمزمہ پارک"
- line 53709 — `karachi_8` — "سفاری باغ"
- line 53729 — `karachi_10` — "Daryalāl Sankat Mochan Temple"
- line 53759 — `karachi_13` — "جزیرہ شمس پیر"

### Lahore (`lahore`) — Pakistan — 8 entries

- line 53079 — `lahore_0` — "شاہی قلعہ"
- line 53089 — `lahore_1` — "فقیر خانہ میوزیم"
- line 53099 — `lahore_2` — "جلو پارک"
- line 53160 — `lahore_8` — "شالامار باغ"
- line 53210 — `lahore_13` — "اقبال پارک"
- line 53240 — `lahore_16` — "شہداء"
- line 53250 — `lahore_17` — "جامعہ کریمیہ نیویں مسجد"
- line 53260 — `lahore_18` — "گوردوارہ جنم آسھن گرو رام داس"

### Encarnación (`encarnacion`) — Paraguay — 1 entries

- line 22486 — `encarnacion_6` — "Virgen de Częstochowa"

### Jeddah (`jeddah`) — Saudi Arabia — 9 entries

- line 54180 — `jeddah_2` — "قشلة جدة"
- line 54190 — `jeddah_3` — "مسجد الملك سعود"
- line 54200 — `jeddah_4` — "مسجد المعمار"
- line 54210 — `jeddah_5` — "مسجد الجفالي"
- line 54251 — `jeddah_9` — "باب الجديد"
- line 54261 — `jeddah_10` — "قصر السلام الملكي"
- line 54271 — `jeddah_11` — "ملاهي الشلال"
- line 54282 — `jeddah_12` — "تيم لاب بوليدرس جدة"
- line 54302 — `jeddah_14` — "Fun Island - جزيرة المرح"

### Medina (`medina`) — Saudi Arabia — 18 entries

- line 54406 — `medina_1` — "مسجد القبلتين"
- line 54416 — `medina_2` — "مسجد الغمامة"
- line 54426 — `medina_3` — "المسجد النبوي"
- line 54436 — `medina_4` — "قمة جبل أحد"
- line 54446 — `medina_5` — "معرض القرآن الكريم"
- line 54457 — `medina_6` — "متحف السلام"
- line 54468 — `medina_7` — "مكتب ابو عبدالله الجابري المدينة"
- line 54478 — `medina_8` — "معرض عمارة المسجد النبوي"
- line 54488 — `medina_9` — "قصر امير المدينة"
- line 54498 — `medina_10` — "J Walk جي ووك"
- line 54509 — `medina_11` — "قصر طيبة"
- line 54529 — `medina_13` — "محطة مخيط - قطار الحجاز"
- line 54539 — `medina_14` — "قصر سعيد بن العاص الأثري"
- line 54549 — `medina_15` — "حديقة السكة الحديدة"
- line 54559 — `medina_16` — "واحة ميلاف"
- line 54570 — `medina_17` — "مزرعة سلمان الفارسي المحمدي"
- line 54580 — `medina_18` — "مركز كوكب البولينج"
- line 54590 — `medina_19` — "مقصد قباء"

### Riyadh (`riyadh`) — Saudi Arabia — 15 entries

- line 53947 — `riyadh_1` — "مهد آل سعود"
- line 53957 — `riyadh_2` — "حديقة الملك سلمان"
- line 53968 — `riyadh_3` — "قلعة المصمك"
- line 53978 — `riyadh_4` — "قصر المربع"
- line 53988 — `riyadh_5` — "المتحف الوطني السعودي"
- line 53998 — `riyadh_6` — "منتزه السويدي"
- line 54008 — `riyadh_7` — "الطريف"
- line 54018 — `riyadh_8` — "بوليفارد رياض سيتي"
- line 54028 — `riyadh_9` — "مسرح محمد عبده"
- line 54048 — `riyadh_11` — "قصر الملك عبد الله بن عبد العزيز"
- line 54058 — `riyadh_12` — "قصر الملك عبدالله بن عبدالعزيز"
- line 54068 — `riyadh_13` — "قصر اليمامة"
- line 54078 — `riyadh_14` — "سباركيز"
- line 54088 — `riyadh_15` — "حديقة الحيوانات"
- line 54108 — `riyadh_17` — "ونترلاند"

### Singapore (`singaporecity`) — Singapore — 1 entries

- line 42949 — `singaporecity_2` — "新加坡佛牙寺龙华院"

### Busan (`busan`) — South Korea — 28 entries

- line 54623 — `busan_0` — "국립해양박물관"
- line 54634 — `busan_1` — "일제강제동원역사관"
- line 54645 — `busan_2` — "복천박물관"
- line 54656 — `busan_3` — "부산박물관"
- line 54667 — `busan_4` — "유엔평화기념관"
- line 54678 — `busan_5` — "범어사"
- line 54689 — `busan_6` — "한국 이슬람교 부산성원"
- line 54700 — `busan_7` — "재한국 국제연합 기념공원"
- line 54711 — `busan_8` — "씨라이프 부산 아쿠아리움"
- line 54722 — `busan_9` — "위안부 평화비"
- line 54732 — `busan_10` — "수영사적공원"
- line 54742 — `busan_11` — "감천문화마을"
- line 54753 — `busan_12` — "용두산공원"
- line 54763 — `busan_13` — "숙등공원"
- line 54773 — `busan_14` — "부산시민공원"
- line 54783 — `busan_15` — "부산항대교"
- line 54793 — `busan_16` — "좌수영성지 곰솔"
- line 54803 — `busan_17` — "해운대 해수욕장"
- line 54813 — `busan_18` — "부산타워"
- line 54823 — `busan_19` — "장산"
- line 54833 — `busan_20` — "금련산"
- line 54843 — `busan_21` — "황령산"
- line 54853 — `busan_22` — "구봉산"
- line 54863 — `busan_23` — "개좌산"
- line 54873 — `busan_24` — "부영벽산파라빌"
- line 54883 — `busan_25` — "금정산서문"
- line 54893 — `busan_26` — "용운사"
- line 54903 — `busan_27` — "북장대"

### Jeju (`jeju`) — South Korea — 21 entries

- line 54945 — `jeju_0` — "국립제주박물관"
- line 54956 — `jeju_1` — "제주목관아"
- line 54967 — `jeju_2` — "넥슨컴퓨터박물관"
- line 54988 — `jeju_4` — "제주러브랜드 Jeju Love Land"
- line 54998 — `jeju_5` — "제주러브랜드"
- line 55008 — `jeju_6` — "제주 4 3 평화공원"
- line 55018 — `jeju_7` — "귤림서원"
- line 55028 — `jeju_8` — "제주성지"
- line 55038 — `jeju_9` — "동문시장"
- line 55048 — `jeju_10` — "수산봉"
- line 55058 — `jeju_11` — "도두봉"
- line 55068 — `jeju_12` — "산세미오름"
- line 55078 — `jeju_13` — "천아오름"
- line 55088 — `jeju_14` — "사라봉"
- line 55109 — `jeju_16` — "한라산국립공원"
- line 55120 — `jeju_17` — "에코랜드 테마파크"
- line 55130 — `jeju_18` — "광해군유배지"
- line 55140 — `jeju_19` — "도련지석묘1호"
- line 55150 — `jeju_20` — "도련지석묘2호"
- line 55160 — `jeju_21` — "수목원 테마파크"
- line 55170 — `jeju_22` — "한라산 국립공원"

### Kaohsiung (`kaohsiung`) — Taiwan — 30 entries

- line 55460 — `kaohsiung_0` — "戰爭與和平紀念公園主題館"
- line 55471 — `kaohsiung_1` — "高雄歷史博物館"
- line 55482 — `kaohsiung_2` — "舊打狗驛故事館"
- line 55493 — `kaohsiung_3` — "國立科學工藝博物館"
- line 55504 — `kaohsiung_4` — "見城館"
- line 55515 — `kaohsiung_5` — "旗後砲台"
- line 55525 — `kaohsiung_6` — "大東文化藝術中心"
- line 55536 — `kaohsiung_7` — "高雄市壽山動物園"
- line 55547 — `kaohsiung_8` — "鳳儀書院"
- line 55558 — `kaohsiung_9` — "駁二藝術特區"
- line 55569 — `kaohsiung_10` — "打狗英國領事館文化園區"
- line 55580 — `kaohsiung_11` — "衛武營都會公園"
- line 55591 — `kaohsiung_12` — "旗後天后宮"
- line 55601 — `kaohsiung_13` — "雄鎮北門"
- line 55611 — `kaohsiung_14` — "逍遙園"
- line 55621 — `kaohsiung_15` — "震洋神社殘跡"
- line 55631 — `kaohsiung_16` — "春秋御閣"
- line 55641 — `kaohsiung_17` — "台灣基督長老教會旗後教會"
- line 55651 — `kaohsiung_18` — "化龍宮"
- line 55661 — `kaohsiung_19` — "蔣公感恩堂"
- line 55671 — `kaohsiung_20` — "瑞豐夜市"
- line 55681 — `kaohsiung_21` — "凹子底森林公園"
- line 55691 — `kaohsiung_22` — "勞工公園"
- line 55701 — `kaohsiung_23` — "高雄公園"
- line 55711 — `kaohsiung_24` — "六合夜市"
- line 55721 — `kaohsiung_25` — "衛武營國家藝術文化中心"
- line 55732 — `kaohsiung_26` — "鳳山青年夜市"
- line 55742 — `kaohsiung_27` — "光之穹頂"
- line 55752 — `kaohsiung_28` — "龍虎塔"
- line 55762 — `kaohsiung_29` — "馳騖寰宇"

### Dushanbe (`dushanbe`) — Tajikistan — 21 entries

- line 55829 — `dushanbe_0` — "Музей музыкальной культуры им. З.Шахиди"
- line 55840 — `dushanbe_1` — "Қасри Миллат"
- line 55850 — `dushanbe_2` — "Боғи Хайём"
- line 55861 — `dushanbe_3` — "Парк \"Победы\""
- line 55871 — `dushanbe_4` — "Боғи ҳайвонот"
- line 55881 — `dushanbe_5` — "Мевлана Яакуб Шарки Мадраса"
- line 55891 — `dushanbe_6` — "Боғи устод Рӯдакӣ"
- line 55901 — `dushanbe_7` — "Боги ботаники"
- line 55911 — `dushanbe_8` — "Свято-Никольский собор"
- line 55921 — `dushanbe_9` — "Ҳайкали Исмоили Сомонӣ"
- line 55931 — `dushanbe_10` — "Филармонияи давлатии Точикистон"
- line 55941 — `dushanbe_11` — "Боғи парчами Тоҷикистон"
- line 55951 — `dushanbe_12` — "Театри Лоҳути"
- line 55961 — `dushanbe_13` — "Театри опера ва балети ба номи Садриддин Айнӣ"
- line 55971 — `dushanbe_14` — "Музей музыкальных инструментов Гурминджа Завкибекова"
- line 55982 — `dushanbe_15` — "Осорхонаи миллии ёдгориҳои бостонии Тоҷикистон"
- line 55993 — `dushanbe_16` — "Осорхонаи миллии Тоҷикистон"
- line 56004 — `dushanbe_17` — "Этнографический музей"
- line 56024 — `dushanbe_19` — "Хонаи Фирӯзшон"
- line 56034 — `dushanbe_20` — "Компьютерные игры"
- line 56044 — `dushanbe_21` — "Алулак"

### Khorog (`khorog`) — Tajikistan — 3 entries

- line 56076 — `khorog_0` — "Кофар-Калъа"
- line 56086 — `khorog_1` — "Музей Памир"
- line 56096 — `khorog_2` — "ГЭС \"Хорог\""

### Ayutthaya (`ayutthaya`) — Thailand — 23 entries

- line 43642 — `ayutthaya_0` — "ป้อมเพชร"
- line 43652 — `ayutthaya_1` — "พิพิธภัณฑสถานแห่งชาติ เจ้าสามพระยา"
- line 43662 — `ayutthaya_2` — "วัดนก"
- line 43672 — `ayutthaya_3` — "วัดบรมพุทธาราม"
- line 43682 — `ayutthaya_4` — "วัดชัยภูมิ"
- line 43692 — `ayutthaya_5` — "วัดมหาทลาย"
- line 43702 — `ayutthaya_6` — "อุทยานประวัติศาสตร์พระนครศรีอยุธยา"
- line 43712 — `ayutthaya_7` — "วัดนักบุญยอแซฟ"
- line 43722 — `ayutthaya_8` — "ตลาดน้ำอโยธยา"
- line 43732 — `ayutthaya_9` — "วัดมเหยงคณ์"
- line 43742 — `ayutthaya_10` — "วัดธรรมิกราช"
- line 43752 — `ayutthaya_11` — "วัดญาณเสน"
- line 43762 — `ayutthaya_12` — "วัดสุวรรณดารารามราชวรวิหาร"
- line 43772 — `ayutthaya_13` — "พิพิธภัณฑสถานแห่งชาติ จันทรเกษม"
- line 43782 — `ayutthaya_14` — "บ้านฮอลันดา"
- line 43792 — `ayutthaya_15` — "หมู่บ้านญี่ปุ่น"
- line 43802 — `ayutthaya_16` — "ศูนย์ข้อมูลการอนุรักษ์นครประวัติศาสตร์พระนครศรีอยุธยา"
- line 43812 — `ayutthaya_17` — "ตลาดน้ำวนบางกะจะ"
- line 43822 — `ayutthaya_18` — "วังช้างอยุธยา แล เพนียด"
- line 43832 — `ayutthaya_19` — "ตลาดกรุงศรี"
- line 43842 — `ayutthaya_20` — "ศูนย์จำหน่ายสินค้าของที่ระลึก วิหารพระมงคลบพิตร"
- line 43852 — `ayutthaya_21` — "หมู่บ้านช้างเพนียดหลวง"
- line 43862 — `ayutthaya_22` — "อยุธยาไนท์มาร์เก็ต"

### Krabi (`krabi`) — Thailand — 20 entries

- line 43904 — `krabi_0` — "วัดไสไทย"
- line 43914 — `krabi_1` — "ศาลหลักเมืองกระบี่"
- line 43934 — `krabi_3` — "มัสยิดบ้านคลองแห้ง"
- line 43944 — `krabi_4` — "อุทยานแห่งชาติหาดนพรัตน์ธารา-หมู่เกาะพีพี"
- line 43954 — `krabi_5` — "อุทยานแห่งชาติเขาพนมเบญจา"
- line 43964 — `krabi_6` — "วัดภูเขาพระมหาโพธิสัตว์"
- line 43974 — `krabi_7` — "สุสานหอย"
- line 43984 — `krabi_8` — "ถ้ำเขาขนาบน้ำ"
- line 43994 — `krabi_9` — "น้ำตกห้วยโต้"
- line 44014 — `krabi_11` — "ดินแดงดอย"
- line 44024 — `krabi_12` — "เขาอ่าวป่อง"
- line 44034 — `krabi_13` — "เขาหน้าแดง"
- line 44044 — `krabi_14` — "เขาหาดปละตก"
- line 44054 — `krabi_15` — "เขาคลองแห้ง"
- line 44064 — `krabi_16` — "เขาอ่าวนาง"
- line 44074 — `krabi_17` — "พิพิธภัณฑ์เรือหลวงลันตา"
- line 44084 — `krabi_18` — "หอศิลป์อันดามัน"
- line 44094 — `krabi_19` — "พิพิธภัณฑ์ลูกปัดอันดามัน"
- line 44104 — `krabi_20` — "ศูนย์วิจัยและพัฒนาการเพาะเลี้ยงสัตว์น้ำชายฝั่งกระบี่"
- line 44114 — `krabi_21` — "ถนนคนเดินกระบี่"

### Phuket (`phuket`) — Thailand — 14 entries

- line 43323 — `phuket_0` — "พิพิธภัณฑสถานแห่งชาติ ถลาง"
- line 43334 — `phuket_1` — "พระพุทธมิ่งมงคลเอกเนาคคีรี"
- line 43355 — `phuket_3` — "วัดมงคลนิมิตร"
- line 43365 — `phuket_4` — "วัดเชิงทะเล"
- line 43375 — `phuket_5` — "อนุสาวรีย์วีรสตรี"
- line 43405 — `phuket_8` — "อุทยานแห่งชาติสิรินาถ"
- line 43425 — `phuket_10` — "แหลมพรหมเทพ"
- line 43435 — `phuket_11` — "เมืองเก่าภูเก็ต"
- line 43445 — `phuket_12` — "หาดกะตะน้อย"
- line 43455 — `phuket_13` — "หาดกะตะ"
- line 43487 — `phuket_16` — "พิพิธภัณฑ์เพอรานากัน"
- line 43580 — `phuket_25` — "สวนสาธารณะเฉลิมพระเกียรติ"
- line 43590 — `phuket_26` — "ถนนคนเดิน หลาดใหญ่"
- line 43600 — `phuket_27` — "สวนสาธารณะเขารัง"

### Ephesus (`ephesus`) — Turkey — 8 entries

- line 56191 — `ephesus_5` — "Hadrian Tapınağı"
- line 56211 — `ephesus_7` — "İsa Bey Camii"
- line 56221 — `ephesus_8` — "Akıncılar Camii"
- line 56231 — `ephesus_9` — "Kılıçaslan Camii"
- line 56251 — `ephesus_11` — "Panayırdağ"
- line 56261 — `ephesus_12` — "Ayasluğ"
- line 56292 — `ephesus_15` — "Taş Mektep Müzesi"
- line 56302 — `ephesus_16` — "Buharlı Lokomotif Müzesi"

### Ashgabat (`ashgabat`) — Turkmenistan — 8 entries

- line 56451 — `ashgabat_4` — "Türkmenistanyň Baş Baýdagy"
- line 56461 — `ashgabat_5` — "Taras Şewçenko binasy"
- line 56521 — `ashgabat_11` — "Türkmenbaşy Ruhy Metjidi"
- line 56611 — `ashgabat_20` — "Baş Drama Teatry"
- line 56641 — `ashgabat_23` — "\"Älem\" medeni dynç alyş merkezi"
- line 56651 — `ashgabat_24` — "Türkmenistanyň Döwlet Sirki"
- line 56711 — `ashgabat_30` — "Mezquita Türkmenbaşy Ruhy (Kipchak)"
- line 56731 — `ashgabat_32` — "Palacio de las Bodas (Bagt Köşgi)"

### Darvaza (`darvaza`) — Turkmenistan — 1 entries

- line 56753 — `darvaza_1` — "Derweze şäherçesi"

### Sharjah (`sharjah`) — United Arab Emirates — 8 entries

- line 56828 — `sharjah_1` — "قلب الشارقة"
- line 56839 — `sharjah_2` — "حديقة الممزر"
- line 56849 — `sharjah_3` — "مسجد النور"
- line 56869 — `sharjah_5` — "الغرفة الماطرة"
- line 56880 — `sharjah_6` — "اشاره الشقه"
- line 56910 — `sharjah_9` — "مربى الشارقة للأحياء المائية"
- line 56921 — `sharjah_10` — "مربعة علي بن راشد"
- line 56982 — `sharjah_16` — "حديقة الصفا"

### Bukhara (`bukhara`) — Uzbekistan — 4 entries

- line 57387 — `bukhara_0` — "Magʻoki Attori masjidi"
- line 57428 — `bukhara_4` — "Gʻulomjon karvonsaroyi"
- line 57558 — `bukhara_17` — "Viloyat oʻlkashunoslik muzeyi"
- line 57568 — `bukhara_18` — "Музей кукол"

### Khiva (`khiva`) — Uzbekistan — 5 entries

- line 57670 — `khiva_4` — "Дишан - Кала"
- line 57781 — `khiva_15` — "Спальня Хана"
- line 57791 — `khiva_16` — "Минарет Чилли-Авлия"
- line 57801 — `khiva_17` — "Вход в комплекс"
- line 57811 — `khiva_18` — "Гробница"

### Tashkent (`tashkent`) — Uzbekistan — 17 entries

- line 57025 — `tashkent_0` — "музей геологии"
- line 57036 — `tashkent_1` — "Ташкентский политехнический музей"
- line 57069 — `tashkent_4` — "Oʻzbekiston Respublikasi Amaliy Sanʼati Muzeyi"
- line 57090 — `tashkent_6` — "Toshkent hayvonot bogʻi"
- line 57121 — `tashkent_9` — "Тарас Шевченко"
- line 57131 — `tashkent_10` — "Дизельная"
- line 57151 — `tashkent_12` — "Ташкентская телебашня"
- line 57162 — `tashkent_13` — "Кафедральный Собор Успения Божeй Матери"
- line 57172 — `tashkent_14` — "Римско-католический Костел Святейшего Сердца Иисуса"
- line 57182 — `tashkent_15` — "Храм святого Равноапостольного великого князя Владимира"
- line 57213 — `tashkent_18` — "Oʻzbekiston milliy bogʻi"
- line 57233 — `tashkent_20` — "Ходжа Ахрор Вали"
- line 57263 — `tashkent_23` — "Мемориальный комлекс \"Парк Победы\""
- line 57283 — `tashkent_25` — "Монумент \"Мужество\""
- line 57293 — `tashkent_26` — "Ильхом"
- line 57313 — `tashkent_28` — "Ташкентские куранты"
- line 57323 — `tashkent_29` — "Минг Урик"

### Ha Long Bay (`halong`) — Vietnam — 7 entries

- line 44510 — `halong_0` — "Vườn quốc gia Cát Bà"
- line 44521 — `halong_1` — "Vịnh Hạ Long"
- line 44531 — `halong_2` — "G. X. Ti Tốp"
- line 44541 — `halong_3` — "Phi Long Thần Tốc"
- line 44561 — `halong_5` — "hòn gà chọi"
- line 44571 — `halong_6` — "Bảo tàng Quảng Ninh"
- line 44591 — `halong_8` — "Khu vui chơi thiếu niên nhi đồng"

### Ho Chi Minh City (`hochiminh`) — Vietnam — 29 entries

- line 44157 — `hochiminh_0` — "Bảo tàng Chứng tích Chiến tranh"
- line 44168 — `hochiminh_1` — "Bảo tàng Mỹ thuật Thành phố Hồ Chí Minh"
- line 44179 — `hochiminh_2` — "Bảo tàng Lịch sử Thành phố Hồ Chí Minh"
- line 44190 — `hochiminh_3` — "Thảo Cầm Viên Sài Gòn"
- line 44201 — `hochiminh_4` — "Chợ Bến Thành"
- line 44212 — `hochiminh_5` — "Bảo tàng Không quân phía Nam"
- line 44222 — `hochiminh_6` — "Bảo tàng Lực lượng Vũ trang miền Đông Nam Bộ"
- line 44232 — `hochiminh_7` — "Chùa Vĩnh Nghiêm"
- line 44243 — `hochiminh_8` — "Nam Thiên Nhất Trụ"
- line 44253 — `hochiminh_9` — "Chùa Phụng Sơn"
- line 44263 — `hochiminh_10` — "Công viên Văn hóa Đầm Sen"
- line 44273 — `hochiminh_11` — "Công viên Lê Văn Tám"
- line 44283 — `hochiminh_12` — "Bưu điện Trung tâm Sài Gòn"
- line 44293 — `hochiminh_13` — "Dinh Độc Lập"
- line 44314 — `hochiminh_15` — "Công viên Chi Lăng"
- line 44324 — `hochiminh_16` — "Công viên Bách Tùng Diệp"
- line 44334 — `hochiminh_17` — "Đền Sri Mariamman"
- line 44344 — `hochiminh_18` — "Đền thờ Vua Hùng"
- line 44354 — `hochiminh_19` — "Cầu Mống"
- line 44364 — `hochiminh_20` — "Chợ Bà Chiểu"
- line 44374 — `hochiminh_21` — "Chợ đầu mối Thủ Đức"
- line 44384 — `hochiminh_22` — "Trụ sở Ủy ban nhân dân Thành phố Hồ Chí Minh"
- line 44395 — `hochiminh_23` — "Nhà hát Thành phố"
- line 44406 — `hochiminh_24` — "Tượng đài Tôn Đức Thắng"
- line 44416 — `hochiminh_25` — "Chợ Bình Tây"
- line 44427 — `hochiminh_26` — "Lăng Lê Văn Duyệt"
- line 44437 — `hochiminh_27` — "Disco Travel - Du lịch Quốc Tế Khám Phá"
- line 44448 — `hochiminh_28` — "Di Tích Chuồng Chim Bồ Câu Người Ấn Tamil"
- line 44458 — `hochiminh_29` — "Thiên đường giải trí Thỏ Trắng"

### Hue (`hue`) — Vietnam — 19 entries

- line 44633 — `hue_0` — "Hoàng Thành Huế"
- line 44643 — `hue_1` — "Cung An Định"
- line 44653 — `hue_2` — "Kinh thành Huế"
- line 44673 — `hue_4` — "Chùa Thiên Mụ"
- line 44683 — `hue_5` — "Chùa Từ Hiếu"
- line 44693 — `hue_6` — "Chùa Quốc Ân"
- line 44703 — `hue_7` — "Nhà Thờ Dòng Chúa Cứu Thế Huế"
- line 44713 — `hue_8` — "Điện Thái Hòa"
- line 44723 — `hue_9` — "Nhà hát Sông Hương"
- line 44733 — `hue_10` — "Chùa Báo Quốc"
- line 44754 — `hue_12` — "Trung tâm Nghệ thuật Điềm Phùng Thị"
- line 44765 — `hue_13` — "Tử Cấm Thành"
- line 44775 — `hue_14` — "Điềm Phùng Thį"
- line 44795 — `hue_16` — "Điện Kiến Trung"
- line 44805 — `hue_17` — "Lăng Tự Đức"
- line 44815 — `hue_18` — "Chợ Đông Ba"
- line 44825 — `hue_19` — "Quốc Tử Giám"
- line 44835 — `hue_20` — "Tượng đài Quan Thế Âm Bồ Tát"
- line 44865 — `hue_23` — "Duyệt Thị Đường"

### Cox's Bazar (`coxsbazar`) — Bangladesh — 1 entries

- line 46367 — `coxsbazar_2` — "গনপূর্ত পার্ক"
