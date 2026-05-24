<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $query = InventoryItem::where('user_id', $userId);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('sku', 'like', "%$search%")
                  ->orWhere('category', 'like', "%$search%");
            });
        }

        // The frontend currently doesn't use pagination for inventory, it expects a full array or we can paginate it.
        // Let's just return all items to be simple, or allow 'all' param
        if ($request->has('all')) {
            return $query->latest()->get();
        }

        return $query->latest()->get(); // Returning all since frontend currently expects an array and does pagination locally or doesn't have pagination yet.
    }

    public function store(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id', 'default_user');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'stock' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['user_id'] = $userId;

        $item = InventoryItem::create($data);

        return response()->json($item, 201);
    }

    public function import(Request $request)
    {
        $userId = $request->header('X-Clerk-User-Id') ?? 'default_user';

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.name' => 'required|string',
            'items.*.stock' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $importedItems = [];
        
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();
            
            foreach ($request->items as $itemData) {
                $itemData['user_id'] = $userId;
                $importedItems[] = InventoryItem::create($itemData);
            }
            
            \Illuminate\Support\Facades\DB::commit();
            
            return response()->json([
                'message' => count($importedItems) . ' items imported successfully.',
                'data' => $importedItems
            ], 201);
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Log::error('Inventory Import Error: ' . $e->getMessage(), [
                'user_id' => $userId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to import inventory items',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function show(InventoryItem $inventoryItem)
    {
        return $inventoryItem;
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $inventoryItem->update($request->all());
        return response()->json($inventoryItem);
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        $inventoryItem->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
