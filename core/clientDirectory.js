import Tree, { Node } from "./tree.js";
import Client from "./client.js"

class ClientDirectory {
    constructor() {
        this._root = new Node(new Subdirectory("global", this));
        this._clients = []
        this._isDirty = true;

        let home = this._root.createChild(new Subdirectory("home", this))
        home.createChild(new Subdirectory("inside", this)).createChild(new Subdirectory("bedroom", this))
        home.createChild(new Subdirectory("outside", this)).createChild(new Subdirectory("backyard", this));
    }

    /**
     * Returns the directory at the specified address, returns undefined if not found.
     * Directory address structure -> "/home/outside/backyard/pool"
     * @param {string | Address} address 
     * @returns {Subdirectory | undefined}
     */
    getSubdirectory(address) {
        if (!Address.isValidFormat(address))
            throw new Error("Provided address isn't valid format: " + address);

        if (address === '/') return this._root.getData();
        /**@type {string[]} */
        var addressPath = address.split('/');
        addressPath.shift();


        var current = this._root;

        for (const roomName of addressPath) {
            var node = current._children.find(c => c.getData()._name === roomName);
            if (node === undefined)
                return undefined;

            current = node;
        }

        return node.getData();
    }

    /**
     * Creates an address from the provided string. Then returns the final subdirectory created.
     * @param {string} address 
     * @returns {Subdirectory}
     */
    createAddress(address) {
        if (!Address.isValidFormat(address))
            throw new Error("Provided address isn't valid format");

        /**@type {string[]} */
        var addressPath = address.split('/');
        addressPath.shift();

        var current = this._root;
        let next = undefined;
        do {
            if (next != undefined) {
                current = next;
                addressPath.shift();
            }

            let roomName = addressPath.at(0);
            next = current._children.find(c => c.getData()._name === roomName);
        } while (next);


        for (const roomName of addressPath) {
            current = current.createChild(new Subdirectory(roomName, this));
            this.setDirty();
        }

        return current._data;
    }

    includes(client) {
        let found = this._root.depthFirstSearch(
            (data) => data._clients.includes(client),
            true);

        return found !== null;
    }

    /**
     * 
     * @returns {Client[]}
     */
    getAllClients() {
        if (!this._isDirty) return this._clients;

        let allDirectoryNodes = this._root.depthFirstSearch(_ => true)
        let allClients = []
        allDirectoryNodes.forEach((directory) => {
            allClients = allClients.concat(directory.getData().getClients())
        })

        this._clients = allClients;
        this._isDirty = false;
        return allClients;
    }

    /**
     * 
     * @param {(data:Client) => boolean} condition 
     * @returns 
     */
    find(condition) {
        return this._root.depthFirstSearch(condition, false);
    }

    remove(client) {
        let found = this._root.depthFirstSearch(
            (data) => data._clients.includes(client),
            true, (dir) => {
                dir.getData().removeClient(client);
            });
    }

    /**
     * @function
     * Forces client array to be repopulated next time it is needed
     */
    setDirty() {
        this._isDirty = true;
    }
}

class Address {
    constructor(str) {
        this._rawAddress = str;
    }

    /**
     * Checks if provided string is a correctly formatted address
     * @static
     * @param {string} str 
     */
    static isValidFormat(str) {
        // Addresses must start with a '/'

        /**
         * @type {((str: string) => boolean)[]}
         */
        var rules = [
            (str) => str.charAt(0) === '/',
            (str) => !str.includes('//'),
        ];

        for (const rule of rules) {
            if (!rule(str))
                return false;
        }

        return true;
    }
}

class Subdirectory {
    /**
     * 
     * @param {string} name 
     * @param {ClientDirectory} directory 
     */
    constructor(name = "New Room", directory = undefined) {
        this._name = name;
        this._clients = [];
        this._directory = directory;
    }

    /**
     * Adds a client to the directory if it doesn't already exist in it
     * @param {Client} client 
     */
    addClient(client) {
        if (this._directory.includes(client)) return;
        this._clients.push(client);
        this._directory?.setDirty();
    }

    removeClient(client) {
        if (!this._clients.includes(client)) return;
        this._clients = this._clients.filter(other => other !== client)
        this._directory?.setDirty();
    }

    getClients() {
        return this._clients;
    }
}

// console.log(Address.isValidFormat("/home")) // True
// console.log(Address.isValidFormat("/home/backyard")) // True
// console.log(Address.isValidFormat("/home//backyard")) // False
// console.log(Address.isValidFormat("home/backyard")) // False

var home = new ClientDirectory();
// console.log(home.getRoom("/home/outside/backyard"));
home.createAddress("/home/outside/backyard/pool/swamp");
home._root.debug();

export default ClientDirectory;
export { Address, Subdirectory };
/**
 * Explanation.
 * Devices that join the Wuz network need to be assigned a room, by a default they are considered in the "Global" room.
 * Rooms will define what information a device has access too
 * 
 * A home should be defined in segments:
 * 
 *              Global
 *                / \
 *               /   \
 *            Front  Back
 *             / \      \   
 *            /   \     Pool
 *     Bedroom    Bathroom
 * Thoughts:
 * Considering making this a Tree instead of a grid
 *  Pros -
 *      Tree: Makes more sense for specifying access to devices based on regions in the home.
 *      Grid: Allows to connect specific rooms to each other so code can be run for neighbouring room
 * 
 * To be fair A tree can do similar things just means a room can't be connected to by multiple parent rooms.
 * Potentially a hybrid system could be used???
 * 
 * Ugh, Tree works better (fuck), just makes less sense in terms of being how a home is laid out!
 * 
 * TODO:
 * Make a Tree instead
 * Need a way of adding clients to rooms
 */