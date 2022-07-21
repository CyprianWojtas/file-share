// @ts-check

/**
 * @param {string} nodeName - node name
 * @param {{ [name: string]: string }} attributes - `name: value` dictionary
 * @param {{ [name: string]: (() => any) | (() => any)[] }} eventListeners - `name: value` dictionary
 */
export function createElement(nodeName, attributes = {}, eventListeners = {})
{
	/** @type {HTMLElement} */
	let element = document.createElement(nodeName);

	for (let attribute in attributes)
		element.setAttribute(attribute, attributes[attribute]);
	
	for (let name in eventListeners)
	{
		let listenerFn = eventListeners[name];

		if (typeof listenerFn == "function")
			element.addEventListener(name, listenerFn);
		else
			for (let listener of listenerFn)
				element.addEventListener(name, listener);
	}

	return element;
}

/**
 * @typedef {{
 * 		name: string,
 *  	attributes?: { [name: string]: string },
 * 		listeners?: { [name: string]: (() => any) | (() => any)[] },
 * 		childNodes?: (ElementParams | HTMLElement | Text | ChildNode | string)[]
 * }} ElementParams
 */

/**
 * 
 * @param {ElementParams} nodeTree 
 */
export function createNodeTree(nodeTree)
{
	let rootNode = createElement(nodeTree.name, nodeTree.attributes, nodeTree.listeners);

	for (let childNode of nodeTree.childNodes || [])
	{
		if (typeof childNode == "string" || childNode instanceof HTMLElement || childNode instanceof Text)
		{
			rootNode.append(childNode);
			continue;
		}

		// @ts-ignore
		rootNode.append(createNodeTree(childNode));
	}

	return rootNode;
}

const ADJECTIVES = 
[
	"Adorable",		"Adventurous",		"Agreeable",		"Alert",		"Alive",		"Amused",
	"Attractive",	"Beautiful",		"Better",			"Black",		"Blue",			"Blushing",
	"Brainy",		"Brave",			"Bright",			"Busy",			"Calm",			"Careful",
	"Cautious",		"Charming",			"Cheerful",			"Clever",		"Clumsy",		"Colorful",
	"Confused",		"Cooperative",		"Courageous",		"Crazy",		"Curious",		"Cute",
	"Delightful",	"Determined",		"Different",		"Distinct",		"Dizzy",		"Eager",
	"Easy",			"Elegant",			"Embarrassed",		"Enchanting",	"Encouraging",	"Energetic",
	"Enthusiastic",	"Excited",			"Exuberant",		"Fair",			"Faithful",		"Famous",
	"Fancy",		"Fantastic",		"Fierce",			"Friendly",		"Funny",		"Gentle",
	"Gifted",		"Glamorous",		"Gleaming",			"Glorious",		"Good",			"Gorgeous",
	"Graceful",		"Grotesque",		"Grumpy",			"Handsome",		"Happy",		"Healthy",
	"Helpful",		"Hilarious",		"Important",		"Impossible",	"Innocent",		"Inquisitive",
	"Jittery",		"Jolly",			"Joyous",			"Kind",			"Lively",		"Lonely",
	"Long",			"Lovely",			"Lucky",			"Magnificent",	"Modern",		"Mushy",
	"Mysterious",	"Nice",				"Nutty",			"Obedient",		"Odd",			"Open",
	"Outstanding",	"Perfect",			"Pleasant",			"Powerful",		"Precious",		"Proud",
	"Puzzled",		"Quaint",			"Real",				"Relieved",		"Rich",			"Shiny",
	"Shy",			"Silly",			"Sleepy",			"Smiling",		"Sparkling",	"Splendid",
	"Strange",		"Successful",		"Super",			"Talented",		"Tame",			"Thankful",
	"Thoughtful",	"Unusual",			"Victorious",		"Vivacious",	"Wandering",	"Wicked",
	"Wild",			"Witty",			"Zany",				"Zealous"
];

const ANIMALS =
[
	"Alligator",	"Ant",			"Arctic Fox",	"Badger",		"Bat",			"Bear",
	"Bee",			"Beetle",		"Butterfly",	"Camel",		"Cat",			"Centipede",
	"Chicken",		"Chimpanzee",	"Cormorant",	"Cow",			"Coyote",		"Crab",
	"Crocodile",	"Crow",			"Deer",			"Dog",			"Dolphin",		"Dove",
	"Dragonfly",	"Duck",			"Eagle",		"Elephant",		"Elk",			"Fennec",
	"Fish",			"Flamingo",		"Fox",			"Frog",			"Giraffe",		"Goat",
	"Goldfish",		"Goose",		"Gorilla",		"Grasshopper",	"Hamster",		"Hare",
	"Hawk",			"Hedgehog",		"Hippopotamus",	"Horse",		"Hyena",		"Jellyfish",
	"Kangaroo",		"Kitten",		"Koala",		"Ladybird",		"Leopard",		"Lion",
	"Lizard",		"Lobster",		"Mole",			"Monkey",		"Moth",			"Mouse",
	"Octopus",		"Ostrich",		"Otter",		"Owl",			"Ox",			"Panda",
	"Parrot",		"Peacock",		"Pelican",		"Penguin",		"Pig",			"Pigeon",
	"Puppy",		"Rabbit",		"Raccoon",		"Rat",			"Raven",		"Reindeer",
	"Robin",		"Sea Lion",		"Sea Turtle",	"Seagull",		"Seahorse",		"Seal",
	"Shark",		"Sheep",		"Snake",		"Sparrow",		"Spider",		"Squid",
	"Squirrel",		"Starfish",		"Stork",		"Swan",			"Tiger",		"Toad",
	"Turkey",		"Turtle",		"Walrus",		"Whale",		"Woodpecker"
];

export function generateName()
{
	return `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`
}