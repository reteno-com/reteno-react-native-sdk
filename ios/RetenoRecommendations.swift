import Foundation
import Reteno

struct Recommendation: Decodable, RecommendableProduct {
    public let productId: String
    public let name: String
    public let description: String?
    public let imageUrl: URL?
    public let price: Float
    
    enum CodingKeys: String, CodingKey {
        case productId, name, description = "descr", imageUrl, price
    }
    
}
