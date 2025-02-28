/**
 * Allows for traversal of Nodes
 * @template T Node Data
 */
class Tree {
    /**
     * 
     * @param {Node<T>} root 
     */
    constructor(root = undefined, maxChildren = undefined) {
        this._root = root;
    }
}


/**
 * Represents the a point of data in a tree
 * @template T
 */
class Node {
    /**
     * 
     * @param {T} data  
     * @param {Node[]} children
     * @param {number} maxChildren
     */
    constructor(data, parent = undefined, children = [], maxChildren = undefined) {
        this._parent = parent;
        this._children = children;
        this._data = data;
        this._maxChildren = maxChildren;

        if (this._parent != undefined)
            this._parent.addChild(this);
    }

    /**
     * Checks if node has no parent
     * @function
     * @returns {boolean}
     */
    isRoot() {
        return this._parent == undefined;
    }

    setParent(parent) {
        if (!this.isRoot())
            this._parent.removeChild(this);

        this._parent = parent;
    }

    /**
     * Checks if node has no children
     * @function
     * @returns {boolean} 
     */
    isLeaf() {
        return this._children.length <= 0;
    }

    /**
     * @function
     * @param {Node<T>} node 
     */
    addChild(node) {
        if (node == undefined) return;

        if (this._children.includes(node) || this.isAncestorOf(node)) return;

        this._children.push(node);
        node.setParent(this);
    }

    /**
     * Creates a child node out of the given data and returns it.
     * @param {T} data 
     * @returns {Node<T>}
     */
    createChild(data) {
        if (data == undefined) return;
        
        let node = new Node(data);
        this.addChild(node);
        
        return node;
    }

    /**
     * @function
     * @param {Node<T>} node 
     */
    removeChild(node) {
        if (this._children.includes(node))
            this._children.splice(this._children.indexOf(node));
    }

    /**
     * Returns the attatched data from the node
     * @function
     * @returns {T}
     */
    getData() {
        return this._data;
    }

    /**
     * Returns an array of all child nodes
     * @function
     * @returns {Node<T>[]}
     */
    getChildren() {
        return this._children;
    }

    /**
     * Returns the number of the maximum allowed children for the node.
     * @function
     * @returns {number}
     */
    getMaxChildren() {
        return this._maxChildren;
    }

    /**
     * Checks if the maximum number of children was set.
     * @function
     * @returns {boolean}
     */
    isChildCapped() {
        return this._maxChildren != undefined;
    }

    /**
     * Checks if the current node is an ancestor of a given node
     * @param {Node<T>} node 
     * @returns 
     */
    isAncestorOf(node){
        let current = node;
        while (current) {
            if(current === this) return true;

            current = current._parent;
        }
    }

    /**
     * Returns all matching nodes for the provided condition. Returns null if none are found.
     * @param {boolean} [exitEarly=false] if true the code will exit on the first found match, returning the found node.
     * @param {(data:T) => boolean} condition 
     * @param {(node:Node<T>) => void} action
     */
    depthFirstSearch(condition, exitEarly = false, action = undefined) {
        let matches = []
        
        // Check children
        this._children.forEach(child => {
            let val = child.depthFirstSearch(condition, exitEarly, action);
            if (val === null) return;
            matches = matches.concat(val);
        });

        if(exitEarly && matches.length >= 1)
            return matches.at(0); 

        // Check if condition is satisfied against the data
        if (condition(this._data)) { 

            if(action != undefined) action(this);
            
            if(exitEarly)
                return this;
            else
                matches.push(this);
        }
        // console.log(matches.length)
        if (matches.length <= 0)
            return null;

        return matches;
    }

    debug() {
        this.depthFirstSearch(() => true, (node) => {console.log(node.getData())});
    }
}

export default Tree;
export { Node }; 