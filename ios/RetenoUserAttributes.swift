//
//  RetenoUserAttributes.swift
//  RetenoSdk
//
//  Created by Valentyn Halkin on 14.12.2022.
//  Copyright © 2022 Facebook. All rights reserved.
//

import Foundation
import Reteno

struct RetenoUserAttributesFieldStruct: Codable {
    let key: String
    let value: String
    init(dictionary: [String: Any]) throws {
        self = try JSONDecoder().decode(
            RetenoUserAttributesFieldStruct.self,
            from: JSONSerialization.data(withJSONObject: dictionary)
        )
    }
}

struct RetenoUserAttributesAddressStruct: Codable {
    init(dictionary: [String: Any]) throws {
        self = try JSONDecoder().decode(
            RetenoUserAttributesAddressStruct.self,
            from: JSONSerialization.data(withJSONObject: dictionary)
        )
    }
    let region: String?
    let town: String?
    let address: String?
    let postcode: String?
}

struct RetenoUserAttributesStruct: Codable {
    init(dictionary: [String: Any]) throws {
        self = try JSONDecoder().decode(
            RetenoUserAttributesStruct.self,
            from: JSONSerialization.data(withJSONObject: dictionary)
        )
    }
    let phone: String?
    let email: String?
    let firstName: String?
    let lastName: String?
    let languageCode: String?
    let timeZone: String?
    let address: RetenoUserAttributesAddressStruct?
    let fields: [RetenoUserAttributesFieldStruct]?
}

struct RetenoUserStruct: Codable {
    init(dictionary: [String: Any]?) throws {
        self = try JSONDecoder().decode(RetenoUserStruct.self, from: JSONSerialization.data(withJSONObject: dictionary ?? [:]))
    }
    let userAttributes: RetenoUserAttributesStruct?
    let subscriptionKeys: [String]?
    let groupNamesInclude: [String]?
    let groupNamesExclude: [String]?
}

public struct RetenoSetUserAttributesPayload: Codable {
    init(userAttributes: UserAttributes?, subscriptionKeys: [String], groupNamesInclude: [String], groupNamesExclude: [String]) {
        self.userAttributes = userAttributes;
        self.subscriptionKeys = subscriptionKeys;
        self.groupNamesInclude = groupNamesInclude;
        self.groupNamesExclude = groupNamesExclude;
    }

    let userAttributes: UserAttributes?
    let subscriptionKeys: [String]
    let groupNamesInclude: [String]
    let groupNamesExclude: [String]
}

public struct RetenoUserAttributes {
    
    
    private init() {}
    
    private static func getStringOrNil(input: String?) -> String? {
        return (input ?? "").isEmpty ? nil : input!
    }
    
    private static func buildUserAttributes(userStruct: RetenoUserStruct) -> UserAttributes {
        let fields = userStruct.userAttributes?.fields?.map { field in
            UserCustomField(key: field.key, value: field.value)
        }
        
        return UserAttributes(
            phone: getStringOrNil(input: userStruct.userAttributes?.phone),
            email: getStringOrNil(input: userStruct.userAttributes?.email),
            firstName: getStringOrNil(input: userStruct.userAttributes?.firstName),
            lastName: getStringOrNil(input: userStruct.userAttributes?.lastName),
            languageCode: getStringOrNil(input: userStruct.userAttributes?.languageCode),
            timeZone: getStringOrNil(input: userStruct.userAttributes?.timeZone),
            address: userStruct.userAttributes?.address != nil ? Address(
                region: getStringOrNil(input: userStruct.userAttributes?.address?.region),
                town: getStringOrNil(input: userStruct.userAttributes?.address?.town),
                address: getStringOrNil(input: userStruct.userAttributes?.address?.address),
                postcode: getStringOrNil(input: userStruct.userAttributes?.address?.postcode)
            ) : nil,
            fields: fields ?? []
        );
    }
    
    public static func buildSetUserAttributesPayload(payload: NSDictionary) throws -> RetenoSetUserAttributesPayload {
        let user = payload["user"] as? [String: Any];
        do {
            let userStruct = try RetenoUserStruct(dictionary: user);
            let userAttributes = userStruct.userAttributes != nil ? buildUserAttributes(userStruct: userStruct) : nil;
            let requestPayload = RetenoSetUserAttributesPayload(
                userAttributes: userAttributes,
                subscriptionKeys: userStruct.subscriptionKeys ?? [],
                groupNamesInclude: userStruct.groupNamesInclude ?? [],
                groupNamesExclude: userStruct.groupNamesExclude ?? []
            )
            
            return requestPayload;
        } catch {
            throw error;
        }
    }
    
    
}
