/**
 * Create new HTML element
 * @param nodeName - node name
 * @param attributes - `name: value` dictionary
 * @param eventListeners - `name: value` dictionary
 */
export function createElement(nodeName, attributes = {}, eventListeners = {}) {
    let element = document.createElement(nodeName);
    for (let attribute in attributes)
        element.setAttribute(attribute, attributes[attribute]);
    for (let name in eventListeners) {
        let listenerFn = eventListeners[name];
        if (typeof listenerFn == "function")
            element.addEventListener(name, listenerFn);
        else
            for (let listener of listenerFn)
                element.addEventListener(name, listener);
    }
    return element;
}
/** Create HTML node tree */
export function createNodeTree(nodeTree) {
    let rootNode = createElement(nodeTree.name, nodeTree.attributes, nodeTree.listeners);
    for (let childNode of nodeTree.childNodes || []) {
        if (typeof childNode == "string" || childNode instanceof HTMLElement || childNode instanceof Text) {
            rootNode.append(childNode);
            continue;
        }
        // @ts-ignore
        rootNode.append(createNodeTree(childNode));
    }
    return rootNode;
}
const ADJECTIVES = [
    "Adorable", "Adventurous", "Agreeable", "Alert", "Alive", "Amused",
    "Attractive", "Beautiful", "Better", "Black", "Blue", "Blushing",
    "Brainy", "Brave", "Bright", "Busy", "Calm", "Careful",
    "Cautious", "Charming", "Cheerful", "Clever", "Clumsy", "Colourful",
    "Confused", "Cooperative", "Courageous", "Crazy", "Curious", "Cute",
    "Delightful", "Determined", "Different", "Distinct", "Dizzy", "Eager",
    "Easy", "Elegant", "Embarrassed", "Enchanting", "Encouraging", "Energetic",
    "Enthusiastic", "Excited", "Exuberant", "Fair", "Faithful", "Famous",
    "Fancy", "Fantastic", "Fierce", "Friendly", "Funny", "Gentle",
    "Gifted", "Glamorous", "Gleaming", "Glorious", "Good", "Gorgeous",
    "Graceful", "Grotesque", "Grumpy", "Handsome", "Happy", "Healthy",
    "Helpful", "Hilarious", "Important", "Impossible", "Innocent", "Inquisitive",
    "Jittery", "Jolly", "Joyous", "Kind", "Lively", "Lonely",
    "Long", "Lovely", "Lucky", "Magnificent", "Modern", "Mushy",
    "Mysterious", "Nice", "Nutty", "Obedient", "Odd", "Open",
    "Outstanding", "Perfect", "Pleasant", "Powerful", "Precious", "Proud",
    "Puzzled", "Quaint", "Real", "Relieved", "Rich", "Shiny",
    "Shy", "Silly", "Sleepy", "Smiling", "Sparkling", "Splendid",
    "Strange", "Successful", "Super", "Talented", "Tame", "Thankful",
    "Thoughtful", "Unusual", "Victorious", "Vivacious", "Wandering", "Wicked",
    "Wild", "Witty", "Zany", "Zealous"
];
const ANIMALS = [
    "Alligator", "Ant", "Arctic Fox", "Badger", "Bat", "Bear",
    "Bee", "Beetle", "Butterfly", "Camel", "Cat", "Centipede",
    "Chicken", "Chimpanzee", "Cormorant", "Cow", "Coyote", "Crab",
    "Crocodile", "Crow", "Deer", "Dog", "Dolphin", "Dove",
    "Dragonfly", "Duck", "Eagle", "Elephant", "Elk", "Fennec",
    "Fish", "Flamingo", "Fox", "Frog", "Giraffe", "Goat",
    "Goldfish", "Goose", "Gorilla", "Grasshopper", "Hamster", "Hare",
    "Hawk", "Hedgehog", "Hippopotamus", "Horse", "Hyena", "Jellyfish",
    "Kangaroo", "Kitten", "Koala", "Ladybird", "Leopard", "Lion",
    "Lizard", "Lobster", "Mole", "Monkey", "Moth", "Mouse",
    "Octopus", "Ostrich", "Otter", "Owl", "Ox", "Panda",
    "Parrot", "Peacock", "Pelican", "Penguin", "Pig", "Pigeon",
    "Puppy", "Rabbit", "Raccoon", "Rat", "Raven", "Reindeer",
    "Robin", "Sea Lion", "Sea Turtle", "Seagull", "Seahorse", "Seal",
    "Shark", "Sheep", "Snake", "Sparrow", "Spider", "Squid",
    "Squirrel", "Starfish", "Stork", "Swan", "Tiger", "Toad",
    "Turkey", "Turtle", "Walrus", "Whale", "Woodpecker"
];
export function generateName() {
    return `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`;
}
/**
 * Generates random id
 * @param length id length (default: 6)
 */
export function generateId(length = 6, base = 10) {
    return Math.floor(Math.random() * base ** length).toString(base).padStart(length, "0").slice(0, length);
}
export function toFileSize(size) {
    if (size > 1024 ** 4)
        return (size / 1024 ** 4).toFixed(2) + " TB";
    if (size > 1024 ** 3)
        return (size / 1024 ** 3).toFixed(2) + " GB";
    if (size > 1024 ** 2)
        return (size / 1024 ** 2).toFixed(2) + " MB";
    if (size > 1024)
        return (size / 1024).toFixed(2) + " kB";
    return size + " B";
}
