import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { Book } from './entities/book.entity.js';

@Injectable()
export class BookService {
  private books:Book[]=[{id:1,title:"test",price:11,createdAt:new Date(),updateAt: new Date()}]
  create(createBookDto: CreateBookDto) {
    if(!createBookDto.title){
      throw new BadRequestException("verifier votrte data"); 
    }
    const lastBook = this.books[this.books.length - 1];
    const nextId:number = lastBook ? lastBook.id + 1 : 1;
    const newBook:Book = {id:nextId,...createBookDto,createdAt:new Date(),updateAt: new Date()};
    this.books.push(newBook);

    return {message:"new book added successfully", data:this.books};
  }
  

  findAll() {
    return this.books;
  }

  findOne(id: number) {
    return `This action returns a #${id} book`;
  }

  update(id: number, updateBookDto: UpdateBookDto) {
    return `This action updates a #${id} book`;
  }

  remove(id: number) {
    return `This action removes a #${id} book`;
  }
}
