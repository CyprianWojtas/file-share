import { createNodeTree } from "../Utils.js";
const connectionContainerStyles = `
`;
class ConnectionsContainer extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "closed" });
        const style = document.createElement("style");
        style.innerHTML = connectionContainerStyles;
        const root = createNodeTree({
            name: "div", attributes: { class: "downloadStatus" },
            childNodes: []
        });
        shadow.append(style, root);
    }
}
