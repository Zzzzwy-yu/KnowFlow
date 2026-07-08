import { useTreeStore } from '@/store/chatStore';
import type { TreeNode } from '@/types';
import { ChevronRight, ChevronDown, Circle } from 'lucide-react';

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const { setActiveNode, toggleExpand, getChildren, activeNodeId } = useTreeStore();
  const children = getChildren(node.id);
  const hasChildren = children.length > 0;
  const isActive = activeNodeId === node.id;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNode(node.id);
  };

  const indentSize = 24;
  const leftPadding = 12;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
          isActive ? 'bg-primary/10' : ''
        }`}
        onClick={handleClick}
        style={{ paddingLeft: `${depth * indentSize + leftPadding}px` }}
      >
        <span className="flex-shrink-0 relative">
          <Circle className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'} transition-colors`} />
          {isActive && (
            <Circle className="w-2 h-2 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          )}
        </span>
        
        <span
          className={`flex-1 text-sm truncate ${
            isActive ? 'text-primary font-medium' : 'text-gray-700'
          }`}
        >
          {node.title}
        </span>
        
        {hasChildren && (
          <button
            onClick={handleToggleExpand}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
          >
            {node.isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
      
      {hasChildren && node.isExpanded && (
        <div className="relative">
          {children.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeNavigator() {
  const { nodes, clearTree } = useTreeStore();

  const rootNodes = Object.values(nodes).filter((node) => node.parentId === null);

  if (rootNodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Circle className="w-8 h-8" />
        </div>
        <p className="text-sm">开始提问以创建知识树</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">知识树</h2>
        <button
          onClick={clearTree}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          清空
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rootNodes.map((rootNode) => (
          <TreeNodeItem key={rootNode.id} node={rootNode} depth={0} />
        ))}
      </div>
    </div>
  );
}
