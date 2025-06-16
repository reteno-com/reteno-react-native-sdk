import Foundation
import Reteno

@objc(RetenoEcomEvent)
class RetenoEcomEvent: NSObject {
    
    static func buildProductDataFromPayload(_ payload: [String: Any]?) -> (product: Ecommerce.Product, currencyCode: String?)? {
        guard let payload = payload else { return nil }
        guard let productDict = payload["product"] as? [String: Any],
              let product = buildProductFromPayload(productDict) else { return nil }
        let currencyCode = payload["currencyCode"] as? String
        
        return (product, currencyCode)
    }
    
    static func buildProductCategoryDataFromPayload(_ payload: [String: Any]?) -> Ecommerce.ProductCategory? {
        guard let payload else { return nil }
        guard let categoryDict = payload["category"] as? [String: Any],
              let category = buildProductCategoryFromPayload(categoryDict) else { return nil }
        
        return category
    }
    
    static func buildCartUpdatedDataFromPayload(_ payload: [String: Any]?) -> (cartId: String, products: [Ecommerce.ProductInCart], currencyCode: String?)? {
        guard let payload = payload else { return nil }
        guard let cartId = payload["cartId"] as? String else { return nil }
        guard let productsArray = payload["cartItems"] as? [[String: Any]] else { return nil }
        
        var productList: [Ecommerce.ProductInCart] = []
        for productDict in productsArray {
            if let item = buildCartItemFromPayload(productDict) {
                productList.append(item)
            }
        }
        
        let currencyCode = payload["currencyCode"] as? String
        
        return (
            cartId: cartId,
            products: productList,
            currencyCode: currencyCode
        )
    }
    
    static func buildOrderDataFromPayload(_ payload: [String: Any]?) -> (order: Ecommerce.Order, currencyCode: String?)? {
        guard let payload = payload else { return nil }
        guard let orderDict = payload["order"] as? [String: Any],
              let order = buildOrderFromPayload(orderDict) else { return nil }        

        let currencyCode = payload["currencyCode"] as? String
        
        return (
            order: order,
            currencyCode: currencyCode
        )
    }
    
    static func buildOrderExternalIdFromPayload(_ payload: [String: Any]?) -> String? {
        guard let payload = payload else { return nil }
        guard let externalOrderId = payload["externalOrderId"] as? String else { return nil }
        
        return externalOrderId
    }
    
    static func buildSearchRequestDataFromPayload(_ payload: [String: Any]?) -> (searchQuery: String, isFound: Bool)? {
        guard let payload = payload else { return nil }
        guard let searchQuery = payload["searchQuery"] as? String else { return nil }
        let isFound = payload["isFound"] as? Bool ?? false
        
        return (
            searchQuery: searchQuery,
            isFound: isFound
        )
    }

    private static func buildAttributesFromPayload(_ payload: [String: Any]?) -> [String: [String]]? {
        guard let payload = payload else { return nil }
        guard let name = payload["name"] as? String else { return nil }
        guard let valueArray = payload["value"] as? [String] else { return nil }
        return [name: valueArray]
    }
    
    private static func buildProductFromPayload(_ payload: [String: Any]?) -> Ecommerce.Product? {
        guard let payload = payload else { return nil }
        guard let productId = payload["productId"] as? String else { return nil }
        guard let price = payload["price"] as? Float else { return nil }
        let isInStock = payload["isInStock"] as? Bool ?? false
        
        var attributes: [String: [String]] = [:]
        if let attributesArray = payload["attributes"] as? [[String: Any]] {
            for attr in attributesArray {
                if let attribute = buildAttributesFromPayload(attr) {
                    attributes.merge(attribute) { (_, new) in new }
                }
            }
        }
        
        return Ecommerce.Product(
            productId: productId,
            price: price,
            isInStock: isInStock,
            attributes: attributes
        )
    }
    
    private static func buildProductCategoryFromPayload(_ payload: [String: Any]?) -> Ecommerce.ProductCategory? {
        guard let payload = payload else { return nil }
        guard let productCategoryId = payload["productCategoryId"] as? String else { return nil }
        
        var attributesList: [String: [String]] = [:]
        if let attributesArray = payload["attributes"] as? [[String: Any]] {
            for attr in attributesArray {
                if let attribute = buildAttributesFromPayload(attr) {
                    attributesList.merge(attribute) { (_, new) in new }
                }
            }
        }
        
        return Ecommerce.ProductCategory(
            productCategoryId: productCategoryId,
            attributes: attributesList
        )
    }
    
    private static func buildCartItemFromPayload(_ payload: [String: Any]?) -> Ecommerce.ProductInCart? {
        guard let payload = payload else { return nil }
        guard let productId = payload["productId"] as? String else { return nil }
        guard let quantity = payload["quantity"] as? Int else { return nil }
        guard let price = payload["price"] as? Float else { return nil }
        let discount = payload["discount"] as? Float
        let name = payload["name"] as? String
        let category = payload["category"] as? String
        
        var attributesList: [String: [String]] = [:]
        if let attributesArray = payload["attributes"] as? [[String: Any]] {
            for attr in attributesArray {
                if let attribute = buildAttributesFromPayload(attr) {
                    attributesList.merge(attribute) { (_, new) in new }
                }
            }
        }
        
        return Ecommerce.ProductInCart(
            productId: productId,
            price: price,
            quantity: quantity,
            discount: discount,
            name: name,
            category: category,
            attributes: attributesList
        )
    }
    
    private static func buildOrderItemFromPayload(_ payload: [String: Any]?) -> Ecommerce.Order.Item? {
        guard let payload = payload else { return nil }
        guard let externalItemId = payload["externalItemId"] as? String else { return nil }
        guard let name = payload["name"] as? String else { return nil }
        guard let category = payload["category"] as? String else { return nil }
        guard let quantity = payload["quantity"] as? Double else { return nil }
        guard let price = payload["price"] as? Float else { return nil }
        guard let url = payload["url"] as? String else { return nil }
        
        let imageUrl = payload["imageUrl"] as? String
        let description = payload["description"] as? String
        
        return Ecommerce.Order.Item(
            externalItemId: externalItemId,
            name: name,
            category: category,
            quantity: quantity,
            cost: price,
            url: url,
            imageUrl: imageUrl,
            description: description
        )
    }


    
    private static func buildOrderFromPayload(_ payload: [String: Any]?) -> Ecommerce.Order? {

              enum LocalStatus: Int {
                case initialized = 1
                case inprogress = 2
                case delivered = 3
                case cancelled = 4
                
                var toOrderStatus: Ecommerce.Order.Status {
                    switch self {
                    case .initialized:
                        return Ecommerce.Order.Status(rawValue: "INITIALIZED")!
                    case .inprogress:
                        return Ecommerce.Order.Status(rawValue: "INPROGRESS")!
                    case .delivered:
                        return Ecommerce.Order.Status(rawValue: "DELIVERED")!
                    case .cancelled:
                        return Ecommerce.Order.Status(rawValue: "CANCELLED")!
                    }
                }
            }


        guard let payload = payload else { return nil }
        guard let externalOrderId = payload["externalOrderId"] as? String else { return nil }
        
        let externalCustomerId = payload["externalCustomerId"] as? String
        guard let totalCost = payload["totalCost"] as? Float else { return nil }
        
        // guard let statusRaw = payload["status"] as? String,
        //       let status = StatusStatus(rawValue: statusRaw) else { return nil }
           guard let statusRaw = payload["status"] as? Int,
                 let localStatus = LocalStatus(rawValue: statusRaw) else { return nil }
    
                 let orderStatus = localStatus.toOrderStatus

       
        let cartId = payload["cartId"] as? String
        let email = payload["email"] as? String
        let phone = payload["phone"] as? String
        let firstName = payload["firstName"] as? String
        let lastName = payload["lastName"] as? String
        let shipping = payload["shipping"] as? Float ?? 0.0
        let discount = payload["discount"] as? Float ?? 0.0
        let taxes = payload["taxes"] as? Float ?? 0.0
        let restoreId = payload["restoreId"] as? String
        let statusDescription = payload["statusDescription"] as? String
        let storeId = payload["storeId"] as? String
        let source = payload["source"] as? String
        let deliveryMethod = payload["deliveryMethod"] as? String
        let paymentMethod = payload["paymentMethod"] as? String
        let deliveryAddress = payload["deliveryAddress"] as? String
        
        var orderItemList: [Ecommerce.Order.Item]?
        if let orderItems = payload["orderItems"] as? [[String: Any]] {
            orderItemList = []
            for itemDict in orderItems {
                if let item = buildOrderItemFromPayload(itemDict) {
                    orderItemList?.append(item)
                }
            }
        }
        
        let attributePairs = payload["attributes"] as? [String: [String: Any]]


        return Ecommerce.Order(
            externalOrderId: externalOrderId,
            totalCost: totalCost,
            status: orderStatus,
            date: Date(),
            cartId: cartId,
            email: email,
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            shipping: shipping,
            discount: discount,
            taxes: taxes,
            restoreUrl: restoreId,
            statusDescription: statusDescription,
            storeId: storeId,
            source: source,
            deliveryMethod: deliveryMethod,
            paymentMethod: paymentMethod,
            deliveryAddress: deliveryAddress,
            items: orderItemList,
            attributes: attributePairs
        )
    }
}
