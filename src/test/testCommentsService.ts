/**
 * 🧪 Test file for CommentsService (metadata validation)
 */

import { CommentsService } from "../services/comments.service";

async function runTests() {
    console.log('\n🚀 Running CommentsService metadata validation tests...\n');

    // Initialize CommentsService with missing owner
    const metadata = {
        owner: 'john',
        repo: 'gpt-cli',
        prNumber: 1,
        prTitle: '',
        prAuthor: ''
    };

    const service = new CommentsService(metadata);

    // Test fetchIssueComments metadata check
    try {
        console.log('🗨️ Fetching issue comments...');
        await service.fetchIssueComments();
    } catch (error: any) {
        console.error('🧩 Expected error:', error.message);
    }

    // Test fetchReviewComments metadata check
    try {
        console.log('\n🧾 Fetching review comments...');
        await service.fetchReviewComments();
    } catch (error: any) {
        console.error('🧩 Expected error:', error.message);
    }

    console.log('\n🏁 Metadata validation tests complete.\n');
}

runTests();
