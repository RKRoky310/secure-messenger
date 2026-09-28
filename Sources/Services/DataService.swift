import Foundation
import CoreData

/// Core Data persistence layer
class DataService {
    static let shared = DataService()
    
    let container: NSPersistentContainer
    let backgroundContext: NSManagedObjectContext
    var viewContext: NSManagedObjectContext {
        container.viewContext
    }
    
    private init() {
        container = NSPersistentContainer(name: "SecureMessenger")
        container.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Failed to load Core Data: \(error)")
            }
        }
        
        backgroundContext = container.newBackgroundContext()
        backgroundContext.automaticallyMergesChangesFromParent = true
    }
    
    /// Save changes to context
    func save(context: NSManagedObjectContext = DataService.shared.viewContext) {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Failed to save context: \(error)")
            }
        }
    }
}
