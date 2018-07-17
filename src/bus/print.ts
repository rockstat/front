import { LevelChildren, LevelChildrenAsync } from './interfaces'

// type PritTree<T extends LevelChildrenAsync> = (node: T, path: Array<string>, level: number) => Array<string>;

// export const printTree: PritTree = (node, path = [], level = 0) => {
//   level = level += 1
//   console.log(`.${path.join('.')} \t\t ${' + '.repeat(node.handlers.length)}`)
//   for (const [name, subnode] of Object.entries(node.children)) {
//     printTree(subnode, [...path].concat([name]))
//   }
// }
