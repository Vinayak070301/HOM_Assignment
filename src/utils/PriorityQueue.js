class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(task) {
    const priority = this._getPriorityScore(task);
    this.values.push({ task, priority });
    this._bubbleUp();
  }

  dequeue() {
    if (this.values.length === 0) return null;
    const max = this.values[0];
    const end = this.values.pop();
    if (this.values.length > 0) {
      this.values[0] = end;
      this._sinkDown();
    }
    return max.task;
  }

  _getPriorityScore(task) {
    const priorityValues = { high: 3, medium: 2, low: 1 };
    const baseScore = priorityValues[task.priority] || 0;
    const timeScore = task.createdAt.getTime() / 1000000000;
    return baseScore + timeScore;
  }

  _bubbleUp() {
    let idx = this.values.length - 1;
    const element = this.values[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.values[parentIdx];
      if (element.priority <= parent.priority) break;
      this.values[parentIdx] = element;
      this.values[idx] = parent;
      idx = parentIdx;
    }
  }

  _sinkDown() {
    let idx = 0;
    const length = this.values.length;
    const element = this.values[0];
    
    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx];
        if (leftChild.priority > element.priority) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx];
        if (
          (!swap && rightChild.priority > element.priority) || 
          (swap && rightChild.priority > leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }

      if (!swap) break;
      this.values[idx] = this.values[swap];
      this.values[swap] = element;
      idx = swap;
    }
  }
}

module.exports = PriorityQueue;