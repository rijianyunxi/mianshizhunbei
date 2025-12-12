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

function dfs(root) {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    console.log(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
}

// dfs(tree);

// function bfs(root) {
//   const queue = [root];
//   while (queue.length) {
//     const node = queue.shift();
//     console.log(node.val);
//     if (node.left) queue.push(node.left);
//     if (node.right) queue.push(node.right);
//   }
// }

function bfs(root) {
  const queue = [root];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++];
    console.log(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
}

// bfs(tree)

// 最大深度
function maxDepth(root) {
  let queue = [root];
  let depth = 0;
  while (queue.length) {
    let len = queue.length;
    depth++;
    while (len--) {
      const node = queue.shift();
      console.log("val:", node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return depth;
}

// console.log(maxDepth(tree));

// 最小深度
function minDepth(root) {
  if (!root) return 0;
  let queue = [root];
  let depth = 1;
  while (queue.length) {
    let len = queue.length;
    while (len--) {
      let node = queue.shift();
      console.log("minDepth", node.val);
      if (!node.left && !node.right) return depth;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    depth++;
  }
  return depth;
}

console.log(minDepth(tree));
