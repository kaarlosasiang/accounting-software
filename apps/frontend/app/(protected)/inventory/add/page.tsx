"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, X } from "lucide-react"

interface InventoryItemForm {
    itemCode: string
    itemName: string
    description: string
    category: string
    unit: string
    quantityOnHand: number
    reorderLevel: number
    unitCost: number
    sellingPrice: number
    isActive: boolean
}

export default function AddInventoryItemPage() {
    const router = useRouter()
    const [formData, setFormData] = useState<InventoryItemForm>({
        itemCode: "",
        itemName: "",
        description: "",
        category: "",
        unit: "",
        quantityOnHand: 0,
        reorderLevel: 0,
        unitCost: 0,
        sellingPrice: 0,
        isActive: true,
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (field: keyof InventoryItemForm, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.itemCode.trim()) {
            newErrors.itemCode = "Item code is required"
        }
        if (!formData.itemName.trim()) {
            newErrors.itemName = "Item name is required"
        }
        if (!formData.category) {
            newErrors.category = "Category is required"
        }
        if (!formData.unit) {
            newErrors.unit = "Unit is required"
        }
        if (formData.quantityOnHand < 0) {
            newErrors.quantityOnHand = "Quantity cannot be negative"
        }
        if (formData.reorderLevel < 0) {
            newErrors.reorderLevel = "Reorder level cannot be negative"
        }
        if (formData.unitCost <= 0) {
            newErrors.unitCost = "Unit cost must be greater than 0"
        }
        if (formData.sellingPrice <= 0) {
            newErrors.sellingPrice = "Selling price must be greater than 0"
        }
        if (formData.sellingPrice < formData.unitCost) {
            newErrors.sellingPrice = "Selling price should be greater than or equal to unit cost"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        // TODO: API call to save inventory item
        console.log("Saving inventory item:", formData)
        
        // Simulate API call
        setTimeout(() => {
            router.push("/inventory")
        }, 500)
    }

    const handleCancel = () => {
        router.back()
    }

    const profitMargin = formData.sellingPrice > 0
        ? (((formData.sellingPrice - formData.unitCost) / formData.sellingPrice) * 100).toFixed(2)
        : "0.00"

    const totalValue = (formData.quantityOnHand * formData.unitCost).toFixed(2)

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="w-fit"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Inventory
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                        Add Inventory Item
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Create a new inventory item with stock details
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {/* Basic Information */}
                    <Card className="border border-border/50">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Item identification and description
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="itemCode">
                                        Item Code <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="itemCode"
                                        placeholder="e.g., FOOD-001 or NONFOOD-001"
                                        value={formData.itemCode}
                                        onChange={(e) => handleChange("itemCode", e.target.value)}
                                        className={errors.itemCode ? "border-destructive" : ""}
                                    />
                                    {errors.itemCode && (
                                        <p className="text-sm text-destructive">{errors.itemCode}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="itemName">
                                        Item Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="itemName"
                                        placeholder="e.g., Rice (50kg sack) or Cleaning Supplies"
                                        value={formData.itemName}
                                        onChange={(e) => handleChange("itemName", e.target.value)}
                                        className={errors.itemName ? "border-destructive" : ""}
                                    />
                                    {errors.itemName && (
                                        <p className="text-sm text-destructive">{errors.itemName}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Optional item description..."
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">
                                        Category <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => handleChange("category", value)}
                                    >
                                        <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Food">Food</SelectItem>
                                            <SelectItem value="Non-Food">Non-Food</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-destructive">{errors.category}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit">
                                        Unit <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.unit}
                                        onValueChange={(value) => handleChange("unit", value)}
                                    >
                                        <SelectTrigger className={errors.unit ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                            <SelectItem value="sack">Sack</SelectItem>
                                            <SelectItem value="box">Box</SelectItem>
                                            <SelectItem value="pack">Pack</SelectItem>
                                            <SelectItem value="bottle">Bottle</SelectItem>
                                            <SelectItem value="can">Can</SelectItem>
                                            <SelectItem value="set">Set</SelectItem>
                                            <SelectItem value="bundle">Bundle</SelectItem>
                                            <SelectItem value="liter">Liter (L)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.unit && (
                                        <p className="text-sm text-destructive">{errors.unit}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Information */}
                    <Card className="border border-border/50">
                        <CardHeader>
                            <CardTitle>Stock Information</CardTitle>
                            <CardDescription>
                                Quantity and reorder settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantityOnHand">
                                        Quantity on Hand <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="quantityOnHand"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.quantityOnHand}
                                        onChange={(e) => handleChange("quantityOnHand", Number(e.target.value))}
                                        className={errors.quantityOnHand ? "border-destructive" : ""}
                                    />
                                    {errors.quantityOnHand && (
                                        <p className="text-sm text-destructive">{errors.quantityOnHand}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reorderLevel">
                                        Reorder Level <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="reorderLevel"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.reorderLevel}
                                        onChange={(e) => handleChange("reorderLevel", Number(e.target.value))}
                                        className={errors.reorderLevel ? "border-destructive" : ""}
                                    />
                                    {errors.reorderLevel && (
                                        <p className="text-sm text-destructive">{errors.reorderLevel}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Alert when stock falls below this level
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card className="border border-border/50">
                        <CardHeader>
                            <CardTitle>Pricing Information</CardTitle>
                            <CardDescription>
                                Cost and selling price details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unitCost">
                                        Unit Cost <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="unitCost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.unitCost}
                                        onChange={(e) => handleChange("unitCost", Number(e.target.value))}
                                        className={errors.unitCost ? "border-destructive" : ""}
                                    />
                                    {errors.unitCost && (
                                        <p className="text-sm text-destructive">{errors.unitCost}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sellingPrice">
                                        Selling Price <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="sellingPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.sellingPrice}
                                        onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
                                        className={errors.sellingPrice ? "border-destructive" : ""}
                                    />
                                    {errors.sellingPrice && (
                                        <p className="text-sm text-destructive">{errors.sellingPrice}</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                                    <p className="text-2xl font-bold text-primary">{profitMargin}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Stock Value</p>
                                    <p className="text-2xl font-bold text-primary">₱{totalValue}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card className="border border-border/50">
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                            <CardDescription>
                                Item availability status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive">Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {formData.isActive
                                            ? "This item is active and available"
                                            : "This item is inactive and hidden"}
                                    </p>
                                </div>
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => handleChange("isActive", checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Save Item
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
