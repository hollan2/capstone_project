/**
 * A directed graph.
 */
export class Graph<V, E> {
    private adjacents: Map<V, Map<V, E>> = new Map();

    insertVertex(vertex: V) {
        this.adjacents.set(vertex, new Map<V, E>());
    }

    insertEdge(fromVertex: V, toVertex: V, edgeData: E) {
        if (!this.adjacents.has(fromVertex) || !this.adjacents.has(toVertex))
            throw new RangeError(
                "graph does not contain one or more specified vertices"
            );

        this.adjacents.get(fromVertex)?.set(toVertex, edgeData);
    }

    hasVertex(vertex: V): boolean {
        return this.adjacents.has(vertex);
    }

    getVertices(): Array<V> {
        return Array.from(this.adjacents.keys());
    }

    updateVertex(oldVertex: V, newVertex: V, newRelation: Map<V, E>) {
        this.adjacents.delete(oldVertex);
        this.adjacents.set(newVertex, newRelation);
    }

    getEdge(fromVertex: V, toVertex: V): E | undefined {
        return this.adjacents.get(fromVertex)?.get(toVertex);
    }

    getEdges(vertex: V): Map<V, E> | undefined {
        return this.adjacents.get(vertex);
    }

    getAllEdges(): Array<[V, V, E]> {
        return Array.from(this.adjacents.entries()).flatMap(
            ([fromVertex, adjacent]) =>
                Array.from(adjacent.entries()).map(
                    ([toVertex, edgeData]) =>
                        [fromVertex, toVertex, edgeData] as [V, V, E]
                )
        );
    }

    getSize(): number {
        return this.adjacents.size;
    }

    removeVertex(vertex: V) {
        const removed = this.adjacents.delete(vertex);

        if (removed) {
            // remove all edges pointing to this vertex
            this.adjacents.forEach((adjacent, _) => {
                adjacent.delete(vertex);
            });
        }

        return removed;
    }

    removeEdge(fromVertex: V, toVertex: V) {
        const adjacent = this.adjacents.get(fromVertex);
        if (adjacent === undefined) return false;

        return adjacent?.delete(toVertex);
    }
}
