/**
 * Allows for traversal of Nodes
 * @template T Node Data
 * @template Y Connection Weight
 */
class Grid {
    /**
     * 
     * @param {Node<T,Y>} root 
     */
    constructor(root) {
        this._root = root;
    }    
}


/**
 * Represents the a point of data in a grid
 * @template T
 * @template Y
 */
class Node {
    /**
     * 
     * @param {T} data  
     * @param {Connection<Y>[]} neighbours
     */
    constructor(data, neighbours=[]){
        this._neighbours = neighbours;
        this._data = data;
    }

    /**
     * @function
     * @param {Node} node 
     */
    addNeighbour(node) {
        if (node == undefined) return;

        this._neighbours.push(node);
    }

    /**
     * @function
     * @param {Node} node 
     */
    removeNeighbour(node) { 
        if (this._neighbours.includes(node))
            this._neighbours.splice(this._neighbours.indexOf(node));
    }

    /**
     * @function
     * @returns {T}
     */
    getData() {
        return this._data;
    }

    /**
     * @function
     * @returns {Node}
     */
    getNeighbours() {
        return this._neighbours;
    }
}

/**
 * @template T
 */
class Connection {
    /**
     * 
     * @param {Node} from 
     * @param {Node} to 
     * @param {T} weight 
     */
    constructor(from, to, weight=undefined){
        this._from = from;
        this._to = to;
        this._weight = weight;
    }
}

export default Grid;
export {Node, Connection}; 