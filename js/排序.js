let arr = [5, 9, 1, 3, 7, 2, 8, 4, 6]

/**
 * sort 排序
 */

arr.sort((a, b) => a - b)
console.log(arr);

/**
 * 冒泡排序
 * 本质是通过相邻元素的比较和交换，将较大的元素逐渐“冒泡”到数组的末尾
 *1 [7,5,3,1,9]
 * 2 [5,3,1,7,9]
 * 3 [3,1,5,7,9]
 * 4 [1,3,5,7,9]
 */
function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
    }
}
/**
 * 冒泡排序优化
 * @param {*} arr 
 * 优化：如果在一次冒泡排序中没有交换任何元素，说明数组已经有序，直接结束排序
 */
function bubbleSortPlus(arr) {
    const len = arr.length
    for (let i = 0; i < len; i++) {
        let hasChange = false
        for (let j = 0; j < len - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                hasChange = true
                let temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
        if (!hasChange) {
            break
        }
    }
}


/**
 * 快速排序
 */

function quickSort(arr) {
    if (arr.length <= 1) {
        return arr
    }
    let pivot = arr[0]
    let left = []
    let right = []
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i])
        } else {
            right.push(arr[i])
        }
    }
    return [...quickSort(left), pivot, ...quickSort(right)]
}

/**
 * 二分查找
 * @param {*} arr 有序数组
 * @param {*} target 要查找的目标值
 * @returns 目标值的索引，如果不存在则返回-1
 */

function binarySearch(arr, target) {
    let left = 0
    let right = arr.length - 1
    while (left <= right) {
        let mid = Math.floor((left + right) / 2)
        if (arr[mid] === target) {
            return mid
        } else if (arr[mid] < target) {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    return -1
}

/**
 * 归并排序
 * 本质是将数组不断地分成两半，对每一半进行排序，最后将排序好的两半合并起来
 */

function mergeSort(arr) {
    if (arr.length <= 1) {
        return arr
    }
    let mid = Math.floor(arr.length / 2)
    let left = mergeSort(arr.slice(0, mid))
    let right = mergeSort(arr.slice(mid))
    return merge(left, right)
}

function merge(left, right) {
    let res = []
    let i = 0
    let j = 0
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            res.push(left[i])
            i++
        } else {
            res.push(right[j])
            j++
        }
    }
    return [...res, ...left.slice(i), ...right.slice(j)]
}

