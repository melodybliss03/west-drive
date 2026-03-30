import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from '../iam/guards/permissions.guard';
import { StorageModule } from '../shared/storage/storage.module';
import { BlogArticle } from './entities/blog-article.entity';
import { AdminBlogController } from './admin-blog.controller';
import { BlogController } from './blog.controller';
import { BlogSeederService } from './blog-seeder.service';
import { BlogService } from './blog.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogArticle]), StorageModule],
  controllers: [BlogController, AdminBlogController],
  providers: [BlogService, BlogSeederService, PermissionsGuard],
  exports: [BlogService],
})
export class BlogModule {}
