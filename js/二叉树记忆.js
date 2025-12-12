const tree = {
  val: "1",
  left: {
    val: "2",
    left: {
      val: "4",
      left: {
        val: 8,
        left: {
          val: 9,
          left: null,
          right: null,
        },
        right: null,
      },
      right: null,
    },
    right: { val: "5", left: null, right: null },
  },
  right: {
    val: "3",
    left: { val: "6", left: null, right: null },
    right: { val: "7", left: null, right: null },
  },
};

// 深度优先 stack

function dfs(root) {
  const stack = [root];

  while (stack.length) {
    const node = stack.pop();
    console.log(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
}
// dfs(tree)

// 广度优先
function bfs(root) {
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    console.log(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}
// bfs(tree);

// 最大深度

function maxDepth(root) {
  const queue = [root];
  let depth = 0;
  while (queue.length) {
    depth++;
    let len = queue.length;
    while (len--) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return depth;
}

console.log(maxDepth(tree));
