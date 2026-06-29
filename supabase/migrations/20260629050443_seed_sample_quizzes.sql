-- RoadTrip Trivia — 3 sample quizzes (Phase 1 validation).
-- These prove the questions jsonb shape end-to-end. Phase 3 loads the full
-- catalog. Idempotent: re-running is a no-op (slug is unique).
--
-- questions shape: [{ id, prompt, options[4], correct_index (0-3) }]

insert into quizzes (slug, title, difficulty, question_count, questions) values
(
  'grand-canyon',
  'Grand Canyon Trivia',
  'easy',
  20,
  '[
    {"id":"gc-1","prompt":"In which U.S. state is Grand Canyon National Park located?","options":["Nevada","Arizona","Utah","Colorado"],"correct_index":1},
    {"id":"gc-2","prompt":"Which river carved the Grand Canyon?","options":["Colorado River","Rio Grande","Snake River","Columbia River"],"correct_index":0},
    {"id":"gc-3","prompt":"Approximately how long is the Grand Canyon?","options":["100 miles","277 miles","500 miles","50 miles"],"correct_index":1},
    {"id":"gc-4","prompt":"In what year did the Grand Canyon become a national park?","options":["1872","1919","1933","1950"],"correct_index":1},
    {"id":"gc-5","prompt":"What is the main visitor hub on the South Rim called?","options":["Jackson Hole","Grand Canyon Village","Wawona","Mammoth"],"correct_index":1},
    {"id":"gc-6","prompt":"The oldest rocks exposed in the Grand Canyon are roughly how old?","options":["200 million years","500 million years","Nearly 2 billion years","4 billion years"],"correct_index":2},
    {"id":"gc-7","prompt":"Which rim is higher, cooler, and open only seasonally?","options":["South Rim","North Rim","East Rim","West Rim"],"correct_index":1},
    {"id":"gc-8","prompt":"Which critically endangered bird was reintroduced to the Grand Canyon?","options":["Bald eagle","Whooping crane","California condor","Peregrine falcon"],"correct_index":2},
    {"id":"gc-9","prompt":"Which tribe has a reservation located within the Grand Canyon?","options":["Cherokee","Sioux","Navajo","Havasupai"],"correct_index":3},
    {"id":"gc-10","prompt":"What turquoise waterfall sits on Havasupai land near the canyon?","options":["Niagara Falls","Multnomah Falls","Yosemite Falls","Havasu Falls"],"correct_index":3},
    {"id":"gc-11","prompt":"Which is a popular South Rim trail descending into the canyon?","options":["Appalachian Trail","Bright Angel Trail","John Muir Trail","Pacific Crest Trail"],"correct_index":1},
    {"id":"gc-12","prompt":"About how deep is the Grand Canyon at its deepest?","options":["About 100 feet","About half a mile","About 1 mile (over 6,000 ft)","About 3 miles"],"correct_index":2},
    {"id":"gc-13","prompt":"What is the historic hotel on the South Rim called?","options":["El Tovar","Old Faithful Inn","The Ahwahnee","The Plaza"],"correct_index":0},
    {"id":"gc-14","prompt":"In which decade was the Grand Canyon named a UNESCO World Heritage Site?","options":["1960s","1970s","1980s","1990s"],"correct_index":1},
    {"id":"gc-15","prompt":"Which president declared the Grand Canyon a national monument in 1908?","options":["Abraham Lincoln","Woodrow Wilson","Theodore Roosevelt","Franklin D. Roosevelt"],"correct_index":2},
    {"id":"gc-16","prompt":"On which rim is the glass Grand Canyon Skywalk located (on tribal land)?","options":["North Rim","South Rim","West Rim","East Rim"],"correct_index":2},
    {"id":"gc-17","prompt":"The canyon''s prominent layered cliffs are primarily made of what rock?","options":["Volcanic glass","Sedimentary rock","Marble","Coal"],"correct_index":1},
    {"id":"gc-18","prompt":"Which lodging sits at the bottom of the canyon near the Colorado River?","options":["Base Camp","Phantom Ranch","Half Dome","Clouds Rest"],"correct_index":1},
    {"id":"gc-19","prompt":"About how many people visit Grand Canyon National Park each year?","options":["About 10,000","About 100,000","About 6 million","About 50 million"],"correct_index":2},
    {"id":"gc-20","prompt":"What weather phenomenon occasionally fills the canyon with clouds?","options":["Gradient","Vortex","Temperature inversion","Eclipse"],"correct_index":2}
  ]'::jsonb
),
(
  'yellowstone',
  'Yellowstone Trivia',
  'easy',
  20,
  '[
    {"id":"ys-1","prompt":"Established in 1872, Yellowstone was the world''s first what?","options":["State park","National park","Wildlife refuge","UNESCO site"],"correct_index":1},
    {"id":"ys-2","prompt":"In which state is most of Yellowstone located?","options":["Montana","Wyoming","Idaho","Colorado"],"correct_index":1},
    {"id":"ys-3","prompt":"What is Yellowstone''s most famous predictable geyser?","options":["Steamboat","Castle","Old Faithful","Riverside"],"correct_index":2},
    {"id":"ys-4","prompt":"Yellowstone sits atop a large volcanic feature known as a what?","options":["Rift valley","Caldera (supervolcano)","Fault scarp","Glacier"],"correct_index":1},
    {"id":"ys-5","prompt":"Which rainbow-colored hot spring is the largest in the United States?","options":["Morning Glory Pool","Emerald Pool","Grand Prismatic Spring","Mammoth"],"correct_index":2},
    {"id":"ys-6","prompt":"Which large mammal, a park symbol, roams Yellowstone in big herds?","options":["Polar bear","American bison","Giraffe","Moose"],"correct_index":1},
    {"id":"ys-7","prompt":"Which predator was reintroduced to Yellowstone in 1995?","options":["Grizzly bear","Mountain lion","Lynx","Gray wolf"],"correct_index":3},
    {"id":"ys-8","prompt":"Which large, high-elevation lake lies within the park?","options":["Lake Tahoe","Yellowstone Lake","Crater Lake","Jackson Lake"],"correct_index":1},
    {"id":"ys-9","prompt":"The Grand Canyon of the Yellowstone features which prominent waterfall?","options":["Lower Falls","Niagara Falls","Yosemite Falls","Havasu Falls"],"correct_index":0},
    {"id":"ys-10","prompt":"Which feature is known for its travertine terrace formations?","options":["Norris","West Thumb","Mammoth Hot Springs","Old Faithful"],"correct_index":2},
    {"id":"ys-11","prompt":"Roughly what share of the world''s geysers are in Yellowstone?","options":["About 5%","About 10%","About half","About 90%"],"correct_index":2},
    {"id":"ys-12","prompt":"Besides Wyoming and Montana, Yellowstone extends into which third state?","options":["Utah","Idaho","Nevada","South Dakota"],"correct_index":1},
    {"id":"ys-13","prompt":"Which Yellowstone geyser is the tallest active geyser in the world?","options":["Old Faithful","Steamboat Geyser","Castle Geyser","Riverside Geyser"],"correct_index":1},
    {"id":"ys-14","prompt":"Which river runs through the park and shares part of its name?","options":["Snake River","Missouri River","Yellowstone River","Green River"],"correct_index":2},
    {"id":"ys-15","prompt":"Which apex omnivore bear species lives in Yellowstone?","options":["Panda","Polar bear","Sun bear","Grizzly bear"],"correct_index":3},
    {"id":"ys-16","prompt":"In which decade was Yellowstone named a UNESCO World Heritage Site?","options":["1960s","1970s","1980s","1990s"],"correct_index":1},
    {"id":"ys-17","prompt":"The vivid colors of Yellowstone''s hot springs are caused mainly by what?","options":["Dyes","Thermophilic microorganisms","Gold minerals","Nighttime algae"],"correct_index":1},
    {"id":"ys-18","prompt":"Which mountain range lies just south of Yellowstone?","options":["Sierra Nevada","Cascades","Teton Range","Appalachians"],"correct_index":2},
    {"id":"ys-19","prompt":"What type of eruption formed the Yellowstone Caldera ~640,000 years ago?","options":["Hawaiian","Strombolian","Caldera-forming supereruption","Phreatic"],"correct_index":2},
    {"id":"ys-20","prompt":"About how many visitors does Yellowstone receive each year?","options":["About 100,000","About 4 million","About 50 million","About 10,000"],"correct_index":1}
  ]'::jsonb
),
(
  'yosemite',
  'Yosemite Trivia',
  'easy',
  20,
  '[
    {"id":"yo-1","prompt":"In which state is Yosemite National Park located?","options":["Oregon","California","Nevada","Washington"],"correct_index":1},
    {"id":"yo-2","prompt":"Which ~3,000 ft granite monolith is famous with rock climbers?","options":["Half Dome","El Capitan","Denali","Mount Whitney"],"correct_index":1},
    {"id":"yo-3","prompt":"Which rounded granite dome is an iconic Yosemite symbol?","options":["El Capitan","Sentinel Dome","Half Dome","Lembert Dome"],"correct_index":2},
    {"id":"yo-4","prompt":"About how tall is Yosemite Falls, one of North America''s tallest?","options":["About 500 feet","About 2,425 feet","About 100 feet","About 5,000 feet"],"correct_index":1},
    {"id":"yo-5","prompt":"Which naturalist is most associated with Yosemite''s preservation?","options":["Henry David Thoreau","John Muir","John James Audubon","Aldo Leopold"],"correct_index":1},
    {"id":"yo-6","prompt":"Yosemite is famous for groves of which giant tree?","options":["Coast redwood","Douglas fir","Giant sequoia","Joshua tree"],"correct_index":2},
    {"id":"yo-7","prompt":"What is the famous valley at the heart of the park called?","options":["Death Valley","Napa Valley","Yosemite Valley","Owens Valley"],"correct_index":2},
    {"id":"yo-8","prompt":"In which mountain range is Yosemite located?","options":["Rocky Mountains","Cascades","Sierra Nevada","Appalachians"],"correct_index":2},
    {"id":"yo-9","prompt":"Which is the largest giant sequoia grove in Yosemite?","options":["Muir Woods","Mariposa Grove","Redwood Grove","Tuolumne Grove"],"correct_index":1},
    {"id":"yo-10","prompt":"The Tunnel View overlook famously frames El Capitan, Half Dome, and which waterfall?","options":["Niagara Falls","Lower Yellowstone Falls","Bridalveil Fall","Havasu Falls"],"correct_index":2},
    {"id":"yo-11","prompt":"Which high-country alpine meadow is popular in summer?","options":["Central Park","Lamar Valley","Hayden Valley","Tuolumne Meadows"],"correct_index":3},
    {"id":"yo-12","prompt":"Which 1864 act signed by Lincoln helped protect Yosemite?","options":["Homestead Act","Yosemite Grant","Wilderness Act","Antiquities Act"],"correct_index":1},
    {"id":"yo-13","prompt":"What is the cable-assisted final route to the top of Half Dome called?","options":["The Nose","The Cables Route","Mist Trail","Angels Landing"],"correct_index":1},
    {"id":"yo-14","prompt":"In what year did Yosemite become a national park?","options":["1864","1872","1890","1916"],"correct_index":2},
    {"id":"yo-15","prompt":"What is the natural ''firefall'' phenomenon at Horsetail Fall in February?","options":["It freezes solid","It glows like lava at sunset","It turns blue","It disappears"],"correct_index":1},
    {"id":"yo-16","prompt":"In what year was Yosemite named a UNESCO World Heritage Site?","options":["1972","1984","1995","2001"],"correct_index":1},
    {"id":"yo-17","prompt":"Which photographer is famous for black-and-white images of Yosemite?","options":["Dorothea Lange","Ansel Adams","Annie Leibovitz","Steve McCurry"],"correct_index":1},
    {"id":"yo-18","prompt":"What is the historic luxury hotel in Yosemite Valley called?","options":["El Tovar","Old Faithful Inn","The Ahwahnee","The Ritz"],"correct_index":2},
    {"id":"yo-19","prompt":"Which Native American people are indigenous to Yosemite Valley?","options":["Cherokee","Inuit","Ahwahnechee","Seminole"],"correct_index":2},
    {"id":"yo-20","prompt":"About how many visitors does Yosemite receive each year?","options":["About 10,000","About 3.5 million","About 50 million","About 100,000"],"correct_index":1}
  ]'::jsonb
)
on conflict (slug) do nothing;
