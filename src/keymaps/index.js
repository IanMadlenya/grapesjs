/**
 * This module allows to create shortcuts for functions and commands (via command id)
 *
 * You can access the module in this way
 * ```js
 * const keymaps = editor.Keymaps;
 * ```
 *
 */
import { isString } from 'underscore';

const keymaster = require('keymaster');

module.exports = () => {
  let em;
  let config;
  const keymaps = {};
  const configDef = {
    defaults: {
      'core:undo': {
        keys: '⌘+z, ctrl+z',
        handler: 'core:undo',
      },
      'core:redo': {
        keys: '⌘+shift+z, ctrl+shift+z',
        handler: 'core:redo',
      },
      'core:copy': {
        keys: '⌘+c, ctrl+c',
        handler: 'core:copy',
      },
      'core:paste': {
        keys: '⌘+v, ctrl+v',
        handler: 'core:paste',
      }
    }
  };

  return {

    keymaster,


    name: 'Keymaps',


    /**
     * Get module configurations
     * @return {Object} Configuration object
     */
    getConfig() {
      return config;
    },


    /**
     * Initialize module
     * @param {Object} config Configurations
     * @private
     */
    init(opts = {}) {
      config = { ...configDef, ...opts };
      em = config.em;
      this.em = em;
      return this;
    },


    onLoad() {
      const defKeys = config.defaults;

      for (let id in defKeys) {
        const value = defKeys[id];
        this.add(id, value.keys, value.handler);
      }
    },


    /**
     * Add new keymap
     * @param {string} id Keymap id
     * @param {string} keys Keymap keys, eg. `ctrl+a`, `⌘+z, ctrl+z`
     * @param {Function|string} handler Keymap handler, might be a function
     * @return {Object} Added keymap
     *  or just a command id as a string
     * @example
     * // 'ns' is just a custom namespace
     * keymaps.add('ns:my-keymap', '⌘+j, ⌘+u, ctrl+j, alt+u', editor => {
     *  console.log('do stuff');
     * });
     * // or
     * keymaps.add('ns:my-keymap', '⌘+s, ctrl+s', 'some-gjs-command');
     *
     * // listen to events
     * editor.on('keymap:emit', (id, shortcut, e) => {
     *  // ...
     * })
     */
    add(id, keys, handler) {
      const em = this.em;
      const cmd = em.get('Commands');
      const editor = em.getEditor();
      const keymap = { id, keys, handler };
      const pk = keymaps[id];
      pk && this.remove(id);
      keymaps[id] = keymap;
      keymaster(keys, (e, h) => {
        // It's safer putting handlers resolution inside the callback
        handler = isString(handler) ? cmd.get(handler) : handler;
        typeof handler == 'object' ? handler.run(editor) : handler(editor);
        const args = [id, h.shortcut, e];
        em.trigger('keymap:emit', ...args);
        em.trigger(`keymap:emit:${id}`, ...args);
      });
      em.trigger('keymap:add', keymap);
      return keymap;
    },


    /**
     * Get the keymap by id
     * @param {string} id Keymap id
     * @return {Object} Keymap object
     * @example
     * keymaps.get('ns:my-keymap');
     * // -> {keys, handler};
     */
    get(id) {
      return keymaps[id];
    },


    /**
     * Get all keymaps
     * @return {Object}
     * @example
     * keymaps.getAll();
     * // -> {id1: {}, id2: {}};
     */
    getAll() {
      return keymaps;
    },


    /**
     * Remove the keymap by id
     * @param {string} id Keymap id
     * @return {Object} Removed keymap
     * @example
     * keymaps.remove('ns:my-keymap');
     * // -> {keys, handler};
     */
    remove(id) {
      const em = this.em;
      const keymap = this.get(id);

      if (keymap) {
        delete keymaps[id];
        keymaster.unbind(keymap.keys);
        em && em.trigger('keymap:remove', keymap);
        return keymap;
      }
    },


  };
};
